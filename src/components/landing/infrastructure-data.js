/**
 * The four Infrastructure cards and their expanded panels.
 *
 * Every string below is transcribed from the reference frames, not written:
 *
 *   closed cards + "Property 1=Default.png"
 *   3D Printing Farm  → "Property 1=Variant2.png"
 *   Creative Studio   → "Property 1=Variant3.png"
 *   Maker Space       → "Property 1=Variant4.png"
 *   Clay Studio & …   → "Property 1=Variant5.png"
 *
 * Two details that look like mistakes but are what the reference draws, and
 * are reproduced rather than tidied:
 *
 *   · 3D Printing Farm labels its left column "CAPABILITY + WORKFLOW" and
 *     underlines each entry; the other three say "MACHINERY + CAPABILITY" and
 *     do not. Hence `underlineCapabilities`.
 *   · Creative Studio, Maker Space and Clay Studio share one description line
 *     ("Explore immersive technologies…"). Only 3D Printing Farm has its own.
 *
 * `title` / `titleAccent` split each heading at the point the reference
 * switches from indigo to pink.
 *
 * `video` points at the asset host, not `public/`: the MP4s are served from
 * https://atlasskilltech.app/atlas-forge-assets/, which keeps them out of the
 * repo and the deployment. `poster` stays local, because it is an image and
 * goes through next/image. The asset origin is allowed by the `media-src`
 * directive in next.config.mjs.
 */
export const INFRASTRUCTURE = [
  {
    id: '3d-printing-farm',
    /* ---- closed card ---- */
    name: '3D Printing Farm',
    cardNote: '(incl. 3D printing, scanning & post-processing)',
    video: 'https://atlasskilltech.app/atlas-forge-assets/infra-3d-printing-farm.mp4',
    poster: '/assets/landing-page/images/infra-3d-printing-farm-poster.jpg',
    /* ---- expanded panel ---- */
    title: '3D Printing ',
    titleAccent: 'Farm',
    subtitle: 'A real part. Often within hours.',
    description:
      'More than 30 printers support early models, working parts, material tests and small production runs.',
    stats: [
      { value: '30+', label: '3D Printers' },
      { value: '150–300', label: 'Parts / Day' },
      { value: '40 × 40 CM', label: 'Build Bed' },
      { value: '3', label: 'Print Technologies' },
    ],
    capabilityLabel: 'Capability + Workflow',
    underlineCapabilities: true,
    capabilities: [
      ['15+ Bambu Lab systems', 'X1E × 2 · H2D · A1 · A1 Mini'],
      ['Qidi XCF Pro · Creality K1/K1C', 'Elegoo Centauri · Saturn 4 Ultra'],
      ['Custom large-format printer', 'Experiential design'],
    ],
    pillsLabel: 'Facility System',
    pills: [
      'PLA',
      'PETG',
      'TPU',
      'PEBA',
      'HIPS',
      'POM',
      'NYLON',
      'PC',
      'ABS',
      'ASA',
      'CARBON FIBRE',
    ],
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    cardNote: '(incl. garment production, content & photography)',
    video: 'https://atlasskilltech.app/atlas-forge-assets/infra-creative-studio.mp4',
    poster: '/assets/landing-page/images/infra-creative-studio-poster.jpg',
    title: 'Creative ',
    titleAccent: 'Studio',
    subtitle: 'Make the sample. Shoot the story.',
    description:
      'Explore immersive technologies that blend digital experiences with physical spaces, from AR/VR environments to interactive media and experimental installations.',
    stats: [
      { value: '90', label: 'Sewing Machines' },
      { value: '80+', label: 'Dress Forms' },
      { value: '2', label: 'Creator Studios' },
      { value: '1', label: 'Complete Sample Floor' },
    ],
    capabilityLabel: 'Machinery + Capability',
    capabilities: [
      ['88 single-needle machines', 'Overlock + flatlock systems'],
      ['Embroidery equipment', 'Leather + heavy-duty machines'],
      ['Cylinder / top-bed machines', 'Vacuum steam finishing'],
    ],
    pillsLabel: 'Material Options',
    pills: [
      'CUTTING TABLES',
      'PRODUCTION SPACE',
      'MAKE-UP DESKS',
      'FABRIC FITTING',
      'STUDIO LIGHTING',
      'IRONING',
    ],
  },
  {
    id: 'maker-space',
    name: 'Maker Space',
    cardNote: '(incl. fabrication, electronics & assembly)',
    video: 'https://atlasskilltech.app/atlas-forge-assets/infra-maker-space.mp4',
    poster: '/assets/landing-page/images/infra-maker-space-poster.jpg',
    title: 'Maker ',
    titleAccent: 'Space',
    subtitle: 'Make it. Assemble it. Test it.',
    description:
      'Explore immersive technologies that blend digital experiences with physical spaces, from AR/VR environments to interactive media and experimental installations.',
    stats: [
      { value: '50+', label: 'Workstations' },
      { value: 'AR / VR', label: 'Immersive Lab' },
      { value: 'FAB LAB', label: 'Assembly + Build' },
      { value: 'ONE', label: 'Connected Campus' },
    ],
    capabilityLabel: 'Machinery + Capability',
    capabilities: [
      ['AR / VR Digital Lab', 'Interactive media systems'],
      ['3D modelling & asset creation', 'High-performance workstations'],
      ['Meta Quest 3 VR Headsets', 'Apple Vision Pro + HTC Vive Pro 2'],
      ['Sony PlayStation 5 Console', 'PSVR2 headsets'],
    ],
    pillsLabel: 'Facility System',
    pills: ['CAD', 'RENDERING', 'SIMULATION', 'ASSEMBLY', 'ELECTRONICS', 'TESTING'],
  },
  {
    id: 'clay-studio-textiles-lab',
    name: 'Clay Studio & Textiles Innovation Lab',
    cardNote: '(incl. smart wearables)',
    video: 'https://atlasskilltech.app/atlas-forge-assets/infra-clay-studio.mp4',
    poster: '/assets/landing-page/images/infra-clay-studio-poster.jpg',
    title: 'Clay Studio &\n',
    titleAccent: 'Textiles Innovation Lab',
    subtitle: 'Experience the future. In real time.',
    description:
      'Explore immersive technologies that blend digital experiences with physical spaces, from AR/VR environments to interactive media and experimental installations.',
    stats: [
      { value: '1', label: 'Clay 3D Printer' },
      { value: '2', label: 'Creators Studio' },
      { value: '1', label: 'Complete Sample Floor' },
      { value: '1', label: 'Storage Space' },
    ],
    capabilityLabel: 'Machinery + Capability',
    capabilities: [
      ['88 single-needle machines', 'Overlock + flatlock systems'],
      ['Embroidery equipment', 'Leather + heavy-duty machines'],
      ['Potter wheel', 'Vacuum steam finishing'],
    ],
    pillsLabel: 'Facility System',
    pills: [
      'CUTTING TABLES',
      'PRODUCTION SPACE',
      'MAKE-UP DESKS',
      'FABRIC FITTING',
      'STUDIO LIGHTING',
      'IRONING',
      '3 Tables',
      '20 Chairs',
    ],
  },
]
