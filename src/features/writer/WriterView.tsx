import { useState, useRef, useEffect, Suspense } from "react";
import { 
  Book, Settings, Download, UploadCloud, RefreshCw, 
  ChevronRight, CheckCircle2, Ruler, Type, Hash, 
  Barcode, Loader2, CreditCard
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { api } from "@/lib/api";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- Data Constants ---
const SIZES = [
  { name: "Mass Market Paperback", inches: '4.19" × 6.87"', w: 106.4, h: 174.5 },
  { name: "Trade Paperback (US)", inches: '6" × 9"', w: 152.4, h: 228.6 },
  { name: "A5", inches: '5.83" × 8.27"', w: 148, h: 210 },
  { name: "Royal", inches: '6.14" × 9.21"', w: 156, h: 234 },
  { name: "Demy", inches: '5.51" × 8.58"', w: 140, h: 218 },
  { name: "Square", inches: '7.5" × 7.5"', w: 190.5, h: 190.5 },
];

const CURRENCIES = [
  { code: "USD", symbol: "$" }, { code: "EUR", symbol: "€" }, 
  { code: "GBP", symbol: "£" }, { code: "INR", symbol: "₹" },
  { code: "CAD", symbol: "$" }, { code: "AUD", symbol: "$" },
];

// --- 3D Book Viewer Component ---
function BookViewer3D({ coverUrl, spineWidth, bookWidth, bookHeight }: { coverUrl: string, spineWidth: number, bookWidth: number, bookHeight: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !coverUrl) return;

    // Dimensions scaled down for 3D viewing (e.g. mm to units)
    const scale = 0.02;
    const w = bookWidth * scale;
    const h = bookHeight * scale;
    const d = spineWidth * scale;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Load Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(coverUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // Calculate UV mapping based on cover layout: [Back | Spine | Front]
      const totalW = w + d + w;
      const backRatio = w / totalW;
      const spineRatio = d / totalW;
      const frontRatio = w / totalW;

      // Materials array (Right, Left, Top, Bottom, Front, Back)
      // Note: ThreeJS BoxGeometry faces: 0: px, 1: nx, 2: py, 3: ny, 4: pz, 5: nz
      const pageMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
      
      const frontMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });
      const spineMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });
      const backMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });

      // Create a book mesh
      const geometry = new THREE.BoxGeometry(w, h, d);
      
      // UV mapping is complex to get exactly right for a single wraparound texture on a BoxGeometry.
      // For simplicity in this demo, we'll use solid colors for spine/back if we can't easily map the sub-regions,
      // OR we can create 3 separate planes grouped together to represent the cover more accurately.

      // Better approach for wraparound: Group of 3 meshes (Front, Spine, Back)
      const bookGroup = new THREE.Group();

      // Front Cover
      const frontGeo = new THREE.BoxGeometry(w, h, 0.05);
      const frontMesh = new THREE.Mesh(frontGeo, [pageMaterial, pageMaterial, pageMaterial, pageMaterial, frontMaterial, pageMaterial]);
      frontMesh.position.set(0, 0, d/2);
      bookGroup.add(frontMesh);

      // Spine
      const spineGeo = new THREE.BoxGeometry(0.05, h, d);
      const spineMesh = new THREE.Mesh(spineGeo, pageMaterial); // Simplified to solid color for now
      spineMesh.position.set(-w/2, 0, 0);
      bookGroup.add(spineMesh);

      // Back Cover
      const backGeo = new THREE.BoxGeometry(w, h, 0.05);
      const backMesh = new THREE.Mesh(backGeo, [pageMaterial, pageMaterial, pageMaterial, pageMaterial, pageMaterial, backMaterial]);
      backMesh.position.set(0, 0, -d/2);
      bookGroup.add(backMesh);

      // Pages (Inner block)
      const pagesGeo = new THREE.BoxGeometry(w - 0.2, h - 0.2, d - 0.1);
      const pagesMesh = new THREE.Mesh(pagesGeo, pageMaterial);
      pagesMesh.position.set(0.1, 0, 0);
      bookGroup.add(pagesMesh);

      // Center the group
      bookGroup.rotation.y = -Math.PI / 4;
      scene.add(bookGroup);

      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    });

    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [coverUrl, spineWidth, bookWidth, bookHeight]);

  return <div ref={mountRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing bg-muted/20 rounded-lg border border-border" />;
}


// --- Main View ---
export function WriterView() {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Config State
  const [selectedSize, setSelectedSize] = useState(SIZES[1]); // Default 6x9
  const [coverType, setCoverType] = useState<"paperback" | "hardcover">("paperback");
  const [gsm, setGsm] = useState<"50" | "70" | "80" | "100" | "120">("80");
  const [shade, setShade] = useState("White");
  const [pageCount, setPageCount] = useState(250);
  const [title, setTitle] = useState("My Epic Novel");
  const [author, setAuthor] = useState("Author Name");
  
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Output State
  const [spineWidth, setSpineWidth] = useState(0);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);

  // --- Handlers ---
  const handleGenerateAssets = async () => {
    setIsGenerating(true);
    try {
      // Fetch spine width first for UI
      const spineRes = await api.get(`/api/writer-desk/spine?pageCount=${pageCount}&gsm=${gsm}&coverType=${coverType}`);
      setSpineWidth(spineRes.data.spineWidth);

      setStage(2);
    } catch (error) {
      console.error("Error generating assets:", error);
      alert("Failed to calculate book specifications.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.post("/api/writer-desk/template", {
        trimWidth: selectedSize.w,
        trimHeight: selectedSize.h,
        pageCount,
        paperGSM: gsm,
        coverType,
        bookTitle: title,
        authorName: author
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cover-template.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Template download failed", error);
      alert("Failed to generate template PDF.");
    }
  };

  const downloadBarcode = async () => {
    if (!isbn) return alert("Please enter an ISBN first.");
    try {
      const response = await api.post("/api/writer-desk/barcode", {
        isbn, price, currency
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'barcode.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Barcode generation failed", error);
      alert("Failed to generate barcode. Ensure ISBN is valid (10 or 13 digits).");
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomCoverFile(file);
      setCustomCoverUrl(URL.createObjectURL(file));
      setStage(3);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writer Desk"
        title="Professional Book Production."
        description="Configure your book's physical specs, generate precise print-ready templates and barcodes, and visualize the final product in 3D."
      />

      <div className="mx-auto mt-8 max-w-5xl px-6 pb-20">
        {/* --- Progress Steps --- */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${stage >= 1 ? 'text-gold' : 'text-muted-foreground'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${stage >= 1 ? 'border-gold bg-gold/10' : 'border-border'}`}>1</div>
            <span className="text-sm font-medium">Configure</span>
          </div>
          <div className="h-px w-12 bg-border"></div>
          <div className={`flex items-center gap-2 ${stage >= 2 ? 'text-gold' : 'text-muted-foreground'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${stage >= 2 ? 'border-gold bg-gold/10' : 'border-border'}`}>2</div>
            <span className="text-sm font-medium">Get Assets</span>
          </div>
          <div className="h-px w-12 bg-border"></div>
          <div className={`flex items-center gap-2 ${stage >= 3 ? 'text-gold' : 'text-muted-foreground'}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${stage >= 3 ? 'border-gold bg-gold/10' : 'border-border'}`}>3</div>
            <span className="text-sm font-medium">3D Preview</span>
          </div>
        </div>

        {/* --- Stage 1: Configure --- */}
        {stage === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Panel>
              <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><Ruler className="w-5 h-5 text-gold"/> Book Dimensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SIZES.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedSize(s)}
                    className={`p-4 rounded-lg border text-left transition-all ${selectedSize.name === s.name ? 'border-gold bg-gold/5 ring-1 ring-gold' : 'border-border hover:border-gold/50'}`}
                  >
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.inches}</div>
                    <div className="text-xs text-muted-foreground">{s.w} × {s.h} mm</div>
                  </button>
                ))}
              </div>
            </Panel>

            <div className="grid md:grid-cols-2 gap-8">
              <Panel>
                <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><Book className="w-5 h-5 text-gold"/> Physical Properties</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cover Type</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={coverType === 'paperback'} onChange={() => setCoverType('paperback')} className="text-gold accent-gold"/> Paperback</label>
                      <label className="flex items-center gap-2 text-sm"><input type="radio" checked={coverType === 'hardcover'} onChange={() => setCoverType('hardcover')} className="text-gold accent-gold"/> Hardcover (+6mm spine)</label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Paper Weight (GSM)</label>
                    <select className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" value={gsm} onChange={e => setGsm(e.target.value as any)}>
                      <option value="50">50 GSM (Thinner, novel standard)</option>
                      <option value="70">70 GSM</option>
                      <option value="80">80 GSM (Standard trade)</option>
                      <option value="100">100 GSM (Premium / Textbooks)</option>
                      <option value="120">120 GSM (Photo books)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Page Count</label>
                    <input type="number" min="24" max="2000" value={pageCount} onChange={e => setPageCount(parseInt(e.target.value) || 24)} className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                    <p className="text-xs text-muted-foreground mt-1">Minimum 24 pages required for perfect binding.</p>
                  </div>
                </div>
              </Panel>

              <Panel>
                <h2 className="text-lg font-medium flex items-center gap-2 mb-6"><Barcode className="w-5 h-5 text-gold"/> Metadata & Barcode</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Book Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Great Gatsby" className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Author Name</label>
                    <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="e.g. F. Scott Fitzgerald" className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ISBN-13 (Optional)</label>
                    <input type="text" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="978-X-XXXX-XXXX-X" className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-muted-foreground">Retail Price</label>
                      <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="19.99" className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                    <div className="w-1/3">
                      <label className="text-sm font-medium text-muted-foreground">Currency</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full mt-2 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleGenerateAssets}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-gold text-black px-6 py-3 rounded-md font-medium hover:bg-gold/90 transition disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin"/> : <Settings className="w-5 h-5" />}
                Generate Design Assets
              </button>
            </div>
          </div>
        )}

        {/* --- Stage 2: Get Assets --- */}
        {stage === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <Panel className="border-gold/30 bg-gold/5">
               <div className="flex items-start gap-4">
                 <CheckCircle2 className="w-6 h-6 text-gold shrink-0 mt-1" />
                 <div>
                   <h3 className="text-lg font-medium text-foreground">Specifications Calculated</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     Based on your inputs, your book spine will be exactly <strong className="text-gold">{spineWidth} mm</strong> thick.
                     Download the precise template and barcode below, design your cover in Canva, and upload the final image in Step 3.
                   </p>
                 </div>
               </div>
            </Panel>

            <div className="grid md:grid-cols-2 gap-6">
              <Panel className="flex flex-col items-center text-center p-8">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Ruler className="w-8 h-8 text-primary"/>
                </div>
                <h3 className="text-lg font-medium">Cover Template (PDF)</h3>
                <p className="text-xs text-muted-foreground mt-2 mb-6">
                  Full wraparound cover template including spine width, 3mm bleed area, and 5mm safe zones. Import this into Canva as a background guide.
                </p>
                <button onClick={downloadTemplate} className="w-full py-2 bg-secondary text-foreground border border-border rounded-md hover:bg-secondary/80 flex items-center justify-center gap-2 text-sm font-medium transition">
                  <Download className="w-4 h-4"/> Download Template
                </button>
              </Panel>

              <Panel className={`flex flex-col items-center text-center p-8 ${!isbn ? 'opacity-50' : ''}`}>
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Barcode className="w-8 h-8 text-primary"/>
                </div>
                <h3 className="text-lg font-medium">ISBN Barcode (PNG)</h3>
                <p className="text-xs text-muted-foreground mt-2 mb-6">
                  {isbn ? `Standard EAN-13 barcode for ISBN ${isbn} with optional 5-digit price supplement.` : 'Provide an ISBN in Step 1 to generate a barcode.'}
                </p>
                <button onClick={downloadBarcode} disabled={!isbn} className="w-full py-2 bg-secondary text-foreground border border-border rounded-md hover:bg-secondary/80 flex items-center justify-center gap-2 text-sm font-medium transition disabled:cursor-not-allowed">
                  <Download className="w-4 h-4"/> Download Barcode
                </button>
              </Panel>
            </div>

            <Panel className="flex flex-col items-center justify-center border-dashed py-16">
               <UploadCloud className="w-10 h-10 text-gold mb-4" />
               <h3 className="text-lg font-medium mb-2">Upload Final Cover Design</h3>
               <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                 Once you've finished designing your full cover (Front + Spine + Back) using the template, upload the flat image (PNG/JPG) here to preview it in 3D.
               </p>
               <input type="file" id="cover-upload" accept="image/png, image/jpeg" className="hidden" onChange={handleCoverUpload} />
               <label htmlFor="cover-upload" className="cursor-pointer bg-gold text-black px-6 py-2 rounded-md font-medium hover:bg-gold/90 transition text-sm">
                 Upload Design
               </label>
            </Panel>
            
            <div className="flex justify-start">
              <button onClick={() => setStage(1)} className="text-sm text-muted-foreground hover:text-foreground underline">← Back to Configuration</button>
            </div>
          </div>
        )}

        {/* --- Stage 3: 3D Preview --- */}
        {stage === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <Panel className="p-0 overflow-hidden relative">
              <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-md border border-border z-10 pointer-events-none">
                <p className="text-sm font-medium flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Interactive 3D Preview</p>
                <p className="text-xs text-muted-foreground mt-1">Drag to rotate • Scroll to zoom</p>
              </div>
              
              {customCoverUrl && (
                <Suspense fallback={<div className="w-full h-[500px] flex items-center justify-center bg-muted/20"><Loader2 className="w-8 h-8 animate-spin text-gold"/></div>}>
                  <BookViewer3D 
                    coverUrl={customCoverUrl} 
                    spineWidth={spineWidth} 
                    bookWidth={selectedSize.w} 
                    bookHeight={selectedSize.h} 
                  />
                </Suspense>
              )}
            </Panel>

            <div className="flex justify-between">
              <button onClick={() => setStage(2)} className="text-sm text-muted-foreground hover:text-foreground underline">← Back to Assets</button>
              <label className="cursor-pointer border border-border bg-secondary text-foreground px-4 py-2 rounded-md font-medium hover:bg-secondary/80 transition text-sm">
                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleCoverUpload} />
                Upload Different Cover
              </label>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
