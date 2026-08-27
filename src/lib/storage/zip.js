import 'server-only'

/**
 * A minimal ZIP writer, store-only (no compression).
 *
 * Written out rather than pulled from a package for two reasons. The archive
 * holds a startup's legal paperwork, and a dependency in that path is a
 * dependency with access to it. And the payload is PDFs and ZIPs, which are
 * already compressed — deflating them costs CPU to save almost nothing, so the
 * only part of the format this needs is the part that concatenates.
 *
 * Output is a `ReadableStream`, and entries are pulled one at a time from the
 * async iterable the caller supplies, so a fourteen-document vault never has
 * more than one document in memory at once.
 *
 * Format: APPNOTE 6.3.2, sections 4.3.7 (local header), 4.3.12 (central
 * directory) and 4.3.16 (end of central directory). No Zip64, which caps an
 * archive at 4GB and any single entry at 4GB — far above the document limit.
 */

const LOCAL_SIGNATURE = 0x04034b50
const CENTRAL_SIGNATURE = 0x02014b50
const EOCD_SIGNATURE = 0x06054b50

/** Version 2.0: the minimum that understands the fields written here. */
const VERSION = 20
/** Bit 11 — filenames are UTF-8, so accented names survive the round trip. */
const UTF8_FLAG = 0x0800
/** Method 0: stored. */
const STORED = 0

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/**
 * MS-DOS date and time, which is what ZIP stores: two-second resolution, and
 * no year before 1980. A date outside that range is clamped rather than
 * written as a negative year that unzip tools read as garbage.
 */
function dosDateTime(date) {
  const when = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date(0)
  const year = Math.max(1980, when.getFullYear())
  const time =
    (when.getHours() << 11) | (when.getMinutes() << 5) | Math.floor(when.getSeconds() / 2)
  const day = ((year - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate()
  return { time, date: day }
}

function localHeader({ nameBytes, crc, size, dos }) {
  const header = Buffer.alloc(30)
  header.writeUInt32LE(LOCAL_SIGNATURE, 0)
  header.writeUInt16LE(VERSION, 4)
  header.writeUInt16LE(UTF8_FLAG, 6)
  header.writeUInt16LE(STORED, 8)
  header.writeUInt16LE(dos.time, 10)
  header.writeUInt16LE(dos.date, 12)
  header.writeUInt32LE(crc, 14)
  header.writeUInt32LE(size, 18) // compressed — identical when stored
  header.writeUInt32LE(size, 22) // uncompressed
  header.writeUInt16LE(nameBytes.length, 26)
  header.writeUInt16LE(0, 28) // no extra field
  return Buffer.concat([header, nameBytes])
}

function centralRecord({ nameBytes, crc, size, dos, offset }) {
  const record = Buffer.alloc(46)
  record.writeUInt32LE(CENTRAL_SIGNATURE, 0)
  record.writeUInt16LE(VERSION, 4) // version made by
  record.writeUInt16LE(VERSION, 6) // version needed
  record.writeUInt16LE(UTF8_FLAG, 8)
  record.writeUInt16LE(STORED, 10)
  record.writeUInt16LE(dos.time, 12)
  record.writeUInt16LE(dos.date, 14)
  record.writeUInt32LE(crc, 16)
  record.writeUInt32LE(size, 20)
  record.writeUInt32LE(size, 24)
  record.writeUInt16LE(nameBytes.length, 28)
  record.writeUInt16LE(0, 30) // extra field length
  record.writeUInt16LE(0, 32) // comment length
  record.writeUInt16LE(0, 34) // disk number
  record.writeUInt16LE(0, 36) // internal attributes
  record.writeUInt32LE(0, 38) // external attributes
  record.writeUInt32LE(offset, 42)
  return Buffer.concat([record, nameBytes])
}

function endOfCentralDirectory({ count, size, offset }) {
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(EOCD_SIGNATURE, 0)
  eocd.writeUInt16LE(0, 4) // this disk
  eocd.writeUInt16LE(0, 6) // disk with the central directory
  eocd.writeUInt16LE(count, 8)
  eocd.writeUInt16LE(count, 10)
  eocd.writeUInt32LE(size, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20) // no archive comment
  return eocd
}

/**
 * Strip anything that would make an entry name unsafe or ambiguous once
 * extracted: path separators, traversal, control characters, and the leading
 * slash some tools treat as absolute.
 */
export function safeEntryName(name) {
  return (
    String(name)
      .replace(/[\\/]+/g, '-')
      .replace(/\.{2,}/g, '.')
      // Control characters, plus the set Windows refuses in a filename.
      .replace(/[\u0000-\u001f<>:"|?*]/g, '')
      .replace(/^[-.\s]+/, '')
      .trim()
      .slice(0, 180) || 'document'
  )
}

/**
 * Build a ZIP as a web ReadableStream.
 *
 * @param {AsyncIterable<{name: string, body: Buffer, date?: Date}>} entries
 * @returns {ReadableStream<Uint8Array>}
 */
export function zipStream(entries) {
  const central = []
  let offset = 0
  let count = 0

  const iterator = entries[Symbol.asyncIterator]()

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()

      if (done) {
        // Everything is written; close with the index that makes it an archive
        // rather than a concatenation.
        const directory = Buffer.concat(central)
        controller.enqueue(
          new Uint8Array(
            Buffer.concat([
              directory,
              endOfCentralDirectory({ count, size: directory.length, offset }),
            ])
          )
        )
        controller.close()
        return
      }

      const nameBytes = Buffer.from(safeEntryName(value.name), 'utf8')
      const body = value.body
      const crc = crc32(body)
      const dos = dosDateTime(value.date)
      const header = localHeader({ nameBytes, crc, size: body.length, dos })

      central.push(centralRecord({ nameBytes, crc, size: body.length, dos, offset }))
      count += 1
      offset += header.length + body.length

      controller.enqueue(new Uint8Array(Buffer.concat([header, body])))
    },

    async cancel() {
      // A viewer who closes the tab mid-download stops the pulls; release the
      // source so no further file is read from disk.
      await iterator.return?.()
    },
  })
}
