import { useState, useRef, useEffect, Suspense } from "react";
import { 
  Book, Settings, Download, UploadCloud, RefreshCw, 
  CheckCircle2, Ruler, Barcode, Loader2, ArrowLeft, ArrowRight,
  Layers, Check, Sparkles, FileText, Sliders, Scissors, Sun,
  Play, Pause, RotateCcw, RotateCw, Eye
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { api } from "@/lib/api";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- Data Constants ---
export interface BookSize {
  name: string;
  inches: string;
  w: number;
  h: number;
}

const SIZES: BookSize[] = [
  { name: "Mass Market Paperback", inches: '4.19" × 6.87"', w: 106.4, h: 174.5 },
  { name: "Trade Paperback (US)", inches: '6" × 9"', w: 152.4, h: 228.6 },
  { name: "A5", inches: '5.83" × 8.27"', w: 148, h: 210 },
  { name: "Royal", inches: '6.14" × 9.21"', w: 156, h: 234 },
  { name: "Demy", inches: '5.51" × 8.58"', w: 140, h: 218 },
  { name: "Square", inches: '7.5" × 7.5"', w: 190.5, h: 190.5 },
];

// Official GS1 / BISG Bookland EAN-5 Currency Lead-Digit Standards
const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($) — US Dollar", prefix: "5" },
  { code: "CAD", symbol: "C$", label: "CAD (C$) — Canadian Dollar", prefix: "6" },
  { code: "GBP", symbol: "£", label: "GBP (£) — British Pound", prefix: "9" },
  { code: "EUR", symbol: "€", label: "EUR (€) — Euro", prefix: "1" },
  { code: "AUD", symbol: "A$", label: "AUD (A$) — Australian Dollar", prefix: "3" },
  { code: "NZD", symbol: "NZ$", label: "NZD (NZ$) — New Zealand Dollar", prefix: "4" },
];

const GSM_THICKNESS: Record<string, number> = {
  "50": 0.05,
  "70": 0.0572,
  "80": 0.0635,
  "100": 0.07,
  "120": 0.08
};

export type MeasurementUnit = "mm" | "in" | "cm";

export const formatDim = (mm: number, unit: MeasurementUnit, withUnit = true): string => {
  if (isNaN(mm) || mm === undefined) return withUnit ? `0 ${unit}` : "0";
  let val: string;
  let suffix: string;
  if (unit === "in") {
    val = (mm / 25.4).toFixed(2);
    suffix = ' in';
  } else if (unit === "cm") {
    val = (mm / 10).toFixed(2);
    suffix = ' cm';
  } else {
    val = mm.toFixed(1);
    suffix = ' mm';
  }
  return withUnit ? `${val}${suffix}` : val;
};

// Helper to set UV mapping directly on a PlaneGeometry
function setPlaneUVs(
  geo: THREE.PlaneGeometry,
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number
) {
  const uv = geo.attributes['uv'];
  if (!uv) return;
  // PlaneGeometry vertices:
  // 0: top-left (-w/2, +h/2) -> (uMin, vMax)
  // 1: top-right (+w/2, +h/2) -> (uMax, vMax)
  // 2: bottom-left (-w/2, -h/2) -> (uMin, vMin)
  // 3: bottom-right (+w/2, -h/2) -> (uMax, vMin)
  uv.setXY(0, uMin, vMax);
  uv.setXY(1, uMax, vMax);
  uv.setXY(2, uMin, vMin);
  uv.setXY(3, uMax, vMin);
  uv.needsUpdate = true;
}

// Helper to create an ultra-sharp procedural default cover texture with 16x anisotropy
function createDefaultCoverTexture(
  title: string, 
  author: string, 
  width = 2048, 
  height = 1536,
  anisotropy = 16
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background gradient: luxury obsidian/charcoal
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#1c1e24');
  grad.addColorStop(0.5, '#13151a');
  grad.addColorStop(1, '#0c0d10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Decorative border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // Thin inner border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(72, 72, width - 144, height - 144);

  // Spine separator guide line (dashed)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 48);
  ctx.lineTo(width / 2, height - 48);
  ctx.stroke();
  ctx.setLineDash([]);

  // Front cover side: Title
  ctx.fillStyle = '#f5f5f7';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const displayTitle = title.length > 24 ? title.substring(0, 22) + '...' : (title || 'GranthAstraX Book');
  ctx.fillText(displayTitle, (width * 3) / 4, height / 2 - 80);

  // Front cover side: Author
  ctx.fillStyle = '#d4af37';
  ctx.font = '500 44px sans-serif';
  const displayAuthor = author ? `by ${author}` : 'Precision Studio Edition';
  ctx.fillText(displayAuthor, (width * 3) / 4, height / 2 + 50);

  // Spine text
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
  ctx.font = '600 32px sans-serif';
  ctx.fillText(displayTitle, 0, 0);
  ctx.restore();

  // Back cover hint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '32px sans-serif';
  ctx.fillText('Back Cover', width / 4, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // 16x Anisotropic filtering ensures razor-sharp text and borders even when angled or zoomed in
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Dedicated rock-solid image loader with 16x Anisotropic filtering & High-Def supersampling
function loadCoverTexture(
  url: string, 
  onLoad: (texture: THREE.CanvasTexture, aspect: number) => void,
  anisotropy = 16
) {
  const img = new Image();
  // CRITICAL: Only set crossOrigin for remote HTTP(S) links, NEVER for data: or blob: URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    img.crossOrigin = 'anonymous';
  }
  let isDone = false;
  const processImage = () => {
    if (isDone) return;
    if (!img.naturalWidth || !img.naturalHeight) return;
    isDone = true;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const aspect = natW / natH;

    // Ultra-sharp supersampling: ensure at least 2560px on the longest dimension
    // If the image is already higher-resolution (e.g., 4K print export), preserve full native resolution!
    const targetMinLongEdge = 2560;
    const scale = Math.max(1, targetMinLongEdge / Math.max(natW, natH));
    const targetW = Math.round(natW * scale);
    const targetH = Math.round(natH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      // High Anisotropy (16x) completely eliminates perspective and zoom blur
      texture.anisotropy = anisotropy;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      onLoad(texture, aspect);
    }
  };

  img.onload = processImage;
  img.onerror = (e) => {
    console.error("Cover texture loading error:", e);
  };
  img.src = url;
  if (img.complete && img.naturalWidth > 0) {
    processImage();
  }
}

// --- 3D Book Viewer Component ---
function BookViewer3D({ 
  coverUrl, 
  spineWidth, 
  bookWidth, 
  bookHeight,
  bleedMm = 3,
  trimBleed = true,
  finish = "matte",
  title = "My Epic Novel",
  author = "Author Name",
  onCoverUpload
}: { 
  coverUrl?: string | null; 
  spineWidth: number; 
  bookWidth: number; 
  bookHeight: number;
  bleedMm?: number;
  trimBleed?: boolean;
  finish?: "matte" | "glossy";
  title?: string;
  author?: string;
  onCoverUpload?: (dataUrl: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const geosRef = useRef<{
    front: THREE.PlaneGeometry;
    spine: THREE.PlaneGeometry;
    back: THREE.PlaneGeometry;
    imageAspect: number;
  } | null>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const specLightRef = useRef<THREE.DirectionalLight | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const autoRotateRef = useRef(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Keep autoRotateRef in sync with state for requestAnimationFrame
  useEffect(() => {
    autoRotateRef.current = isAutoRotating;
  }, [isAutoRotating]);

  // Apply UV mapping based on trimBleed and bleedMm
  const updateUVs = (
    imageAspect: number,
    geos: { front: THREE.PlaneGeometry; spine: THREE.PlaneGeometry; back: THREE.PlaneGeometry }
  ) => {
    const isFullWrap = imageAspect >= 1.2;
    const templateBleedMm = 3;
    const totalTemplateW = (bookWidth * 2) + spineWidth + (templateBleedMm * 2);
    const totalTemplateH = bookHeight + (templateBleedMm * 2);

    if (isFullWrap) {
      if (trimBleed && bleedMm > 0) {
        // When trimBleed is ON, chop off the outer bleed/slug margin
        const uCut = bleedMm / totalTemplateW;
        const vCut = bleedMm / totalTemplateH;

        const uBackMin = Math.max(0, uCut);
        const uBackMax = (templateBleedMm + bookWidth) / totalTemplateW;

        const uSpineMin = uBackMax;
        const uSpineMax = (templateBleedMm + bookWidth + spineWidth) / totalTemplateW;

        const uFrontMin = uSpineMax;
        const uFrontMax = Math.min(1.0, 1.0 - uCut);

        const vMin = Math.max(0, vCut);
        const vMax = Math.min(1.0, 1.0 - vCut);

        setPlaneUVs(geos.front, uFrontMin, uFrontMax, vMin, vMax);
        setPlaneUVs(geos.spine, uSpineMin, uSpineMax, vMin, vMax);
        setPlaneUVs(geos.back, uBackMin, uBackMax, vMin, vMax);
      } else {
        // When trimBleed is OFF, show the FULL UN-CHOPPED image edge-to-edge (including outer bleed guides/margins)
        const uBackMax = (templateBleedMm + bookWidth) / totalTemplateW;
        const uSpineMax = (templateBleedMm + bookWidth + spineWidth) / totalTemplateW;

        setPlaneUVs(geos.front, uSpineMax, 1.0, 0.0, 1.0);
        setPlaneUVs(geos.spine, uBackMax, uSpineMax, 0.0, 1.0);
        setPlaneUVs(geos.back, 0.0, uBackMax, 0.0, 1.0);
      }
    } else {
      // Single portrait front cover
      if (trimBleed && bleedMm > 0) {
        const uCut = bleedMm / bookWidth;
        const vCut = bleedMm / bookHeight;
        setPlaneUVs(geos.front, uCut, 1.0 - uCut, vCut, 1.0 - vCut);
      } else {
        setPlaneUVs(geos.front, 0.0, 1.0, 0.0, 1.0);
      }
      setPlaneUVs(geos.spine, 0.0, 1.0, 0.0, 1.0);
      setPlaneUVs(geos.back, 0.0, 1.0, 0.0, 1.0);
    }
  };

  // Main 3D scene setup (Constructed ONCE and preserved across texture/control changes)
  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    currentMount.innerHTML = '';

    const scale = 0.02;
    const w = Math.max(bookWidth * scale, 0.5);
    const h = Math.max(bookHeight * scale, 0.5);
    const d = Math.max(spineWidth * scale, 0.08);

    const containerW = currentMount.clientWidth || currentMount.offsetWidth || 800;
    const containerH = currentMount.clientHeight || currentMount.offsetHeight || 520;
    const safeAspect = containerH > 0 ? containerW / containerH : 1.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, safeAspect, 0.1, 100);
    camera.position.set(0, 1.2, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerW, containerH);
    // Supersample pixel ratio for crystal-clear texture resolution when zooming in:
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(Math.min(dpr, 3));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 16;

    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.userSelect = 'none';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';
    mountRef.current.appendChild(renderer.domElement);

    // Attach OrbitControls directly to renderer.domElement for pristine mouse & touch rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableRotate = true;
    controls.rotateSpeed = 1.0;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.enablePan = false; // Keep book centered
    controls.minDistance = 2.0;
    controls.maxDistance = 18;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const preventDrag = (e: DragEvent) => e.preventDefault();
    renderer.domElement.addEventListener('dragstart', preventDrag);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(5, 6, 5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Specular highlight light for glossy sheen reflection
    const specLight = new THREE.DirectionalLight(0xffffff, finish === "glossy" ? 1.2 : 0.35);
    specLight.position.set(2, 6, 8);
    scene.add(specLight);
    specLightRef.current = specLight;

    // Base Material: Start with default procedural texture with 16x anisotropy
    const initialTexture = createDefaultCoverTexture(title, author, 2048, 1536, maxAnisotropy);
    const isGlossy = finish === "glossy";
    const coverMaterial = new THREE.MeshPhysicalMaterial({ 
      map: initialTexture, 
      roughness: isGlossy ? 0.12 : 0.82,
      metalness: isGlossy ? 0.08 : 0.0,
      clearcoat: isGlossy ? 1.0 : 0.0,
      clearcoatRoughness: isGlossy ? 0.08 : 0.8,
      reflectivity: isGlossy ? 0.9 : 0.1,
      side: THREE.DoubleSide,
    });
    materialRef.current = coverMaterial;

    const pageMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf4ecd8, 
      roughness: 0.9 
    });

    // Geometries
    const frontGeo = new THREE.PlaneGeometry(w, h);
    const spineGeo = new THREE.PlaneGeometry(d, h);
    const backGeo = new THREE.PlaneGeometry(w, h);

    geosRef.current = {
      front: frontGeo,
      spine: spineGeo,
      back: backGeo,
      imageAspect: 1.5
    };

    updateUVs(1.5, geosRef.current);

    const bookGroup = new THREE.Group();
    bookGroupRef.current = bookGroup;

    // Front Cover Plane
    const frontMesh = new THREE.Mesh(frontGeo, coverMaterial);
    frontMesh.position.set(0, 0, d/2);
    bookGroup.add(frontMesh);

    // Spine Plane
    const spineMesh = new THREE.Mesh(spineGeo, coverMaterial);
    spineMesh.position.set(-w/2, 0, 0);
    spineMesh.rotation.y = -Math.PI / 2;
    bookGroup.add(spineMesh);

    // Back Cover Plane
    const backMesh = new THREE.Mesh(backGeo, coverMaterial);
    backMesh.position.set(0, 0, -d/2);
    backMesh.rotation.y = Math.PI; // Face backwards
    bookGroup.add(backMesh);

    // Pages (Inner block)
    const pagesGeo = new THREE.BoxGeometry(Math.max(w - 0.03, 0.1), Math.max(h - 0.03, 0.1), Math.max(d - 0.015, 0.04));
    const pagesMesh = new THREE.Mesh(pagesGeo, pageMaterial);
    pagesMesh.position.set(0.015, 0, 0);
    bookGroup.add(pagesMesh);

    // Center and angle the book nicely at front 3D showcase perspective
    bookGroup.rotation.y = -0.35;
    scene.add(bookGroup);

    // If an initial coverUrl is already present on mount, load it immediately with 16x anisotropy
    if (coverUrl) {
      loadCoverTexture(coverUrl, (tex, aspect) => {
        if (coverMaterial.map && coverMaterial.map !== tex) {
          coverMaterial.map.dispose();
        }
        coverMaterial.map = tex;
        coverMaterial.needsUpdate = true;
        if (geosRef.current) {
          geosRef.current.imageAspect = aspect;
          updateUVs(aspect, geosRef.current);
        }
      }, maxAnisotropy);
    }

    let animId: number;
    // Continuous animation loop that smoothly rotates the turntable if auto-spin is on
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotateRef.current && bookGroupRef.current) {
        bookGroupRef.current.rotation.y += 0.008;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Use ResizeObserver for responsive resizing even during CSS transition/animation
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rw = entry.contentRect.width;
        const rh = entry.contentRect.height;
        if (rw > 0 && rh > 0) {
          camera.aspect = rw / rh;
          camera.updateProjectionMatrix();
          renderer.setSize(rw, rh);
        }
      }
    });
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    const handleWindowResize = () => {
      if (!mountRef.current) return;
      const rw = mountRef.current.clientWidth;
      const rh = mountRef.current.clientHeight;
      if (rw > 0 && rh > 0) {
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      renderer.domElement.removeEventListener('dragstart', preventDrag);
      controls.dispose();
      controlsRef.current = null;
      bookGroupRef.current = null;
      cameraRef.current = null;
      geosRef.current = null;
      materialRef.current = null;
      specLightRef.current = null;
      rendererRef.current = null;
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [bookWidth, bookHeight, spineWidth]);

  // Re-apply UVs immediately whenever trimBleed or bleedMm change without rebuilding the 3D scene
  useEffect(() => {
    if (geosRef.current) {
      updateUVs(geosRef.current.imageAspect, geosRef.current);
    }
  }, [trimBleed, bleedMm, bookWidth, bookHeight, spineWidth]);

  // Reactive Finish update (Matte vs Glossy) in real-time
  useEffect(() => {
    if (materialRef.current) {
      const isGlossy = finish === "glossy";
      materialRef.current.roughness = isGlossy ? 0.12 : 0.82;
      materialRef.current.metalness = isGlossy ? 0.08 : 0.0;
      materialRef.current.clearcoat = isGlossy ? 1.0 : 0.0;
      materialRef.current.clearcoatRoughness = isGlossy ? 0.08 : 0.8;
      materialRef.current.reflectivity = isGlossy ? 0.9 : 0.1;
      materialRef.current.needsUpdate = true;
    }
    if (specLightRef.current) {
      specLightRef.current.intensity = finish === "glossy" ? 1.2 : 0.35;
    }
  }, [finish]);

  // Reactive Cover Texture Loader: Swaps texture smoothly without destroying 3D scene or controls
  useEffect(() => {
    if (!materialRef.current || !geosRef.current) return;

    const maxAnis = rendererRef.current?.capabilities.getMaxAnisotropy() || 16;

    if (coverUrl) {
      loadCoverTexture(coverUrl, (tex, aspect) => {
        if (materialRef.current && geosRef.current) {
          if (materialRef.current.map && materialRef.current.map !== tex) {
            materialRef.current.map.dispose();
          }
          materialRef.current.map = tex;
          materialRef.current.needsUpdate = true;
          geosRef.current.imageAspect = aspect;
          updateUVs(aspect, geosRef.current);
        }
      }, maxAnis);
    } else {
      const defTex = createDefaultCoverTexture(title, author, 2048, 1536, maxAnis);
      if (defTex && materialRef.current && geosRef.current) {
        if (materialRef.current.map && materialRef.current.map !== defTex) {
          materialRef.current.map.dispose();
        }
        materialRef.current.map = defTex;
        materialRef.current.needsUpdate = true;
        geosRef.current.imageAspect = 1.5;
        updateUVs(1.5, geosRef.current);
      }
    }
  }, [coverUrl, title, author]);

  // Interactive Rotation Helpers
  const rotateLeft = () => {
    if (bookGroupRef.current) {
      bookGroupRef.current.rotation.y -= Math.PI / 4;
    }
  };

  const rotateRight = () => {
    if (bookGroupRef.current) {
      bookGroupRef.current.rotation.y += Math.PI / 4;
    }
  };

  const setViewAngle = (angle: number) => {
    setIsAutoRotating(false);
    if (bookGroupRef.current) {
      bookGroupRef.current.rotation.y = angle;
    }
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 1.2, 7.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const resetView = () => {
    setIsAutoRotating(false);
    if (bookGroupRef.current) {
      bookGroupRef.current.rotation.y = -0.35;
    }
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 1.2, 7.5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Drag-and-drop file upload handlers on the 3D canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg') && onCoverUpload) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onCoverUpload(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className={`relative w-full h-[540px] rounded-lg overflow-hidden bg-muted/20 border transition-all ${
        isDraggingOver ? 'border-gold ring-2 ring-gold/40 bg-gold/5' : 'border-border'
      }`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
      onDrop={handleDrop}
    >
      <div 
        ref={mountRef} 
        onDragStart={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none" 
        style={{ touchAction: 'none' }}
      />

      {/* Top Floating Info: Status & Instructions */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/80 px-2.5 py-1 rounded-full text-[11px] font-medium text-muted-foreground shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        <span>Drag to rotate • Scroll to zoom</span>
      </div>

      <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-1.5 bg-background/80 backdrop-blur-md border border-border/80 px-2.5 py-1 rounded-full text-[11px] font-mono text-foreground shadow-xs">
        {coverUrl ? (
          <>
            <span className="text-emerald-400">✓</span>
            <span className="text-emerald-300 font-semibold">Custom Cover Active</span>
          </>
        ) : (
          <>
            <span className="text-amber-400">✦</span>
            <span className="text-muted-foreground">Default Blueprint Cover</span>
          </>
        )}
      </div>

      {/* Drag & Drop Visual Overlay Guide */}
      {isDraggingOver && (
        <div className="absolute inset-0 pointer-events-none bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-gold text-gold z-20 animate-in fade-in duration-200">
          <UploadCloud className="size-10 mb-2 animate-bounce" />
          <p className="font-semibold text-sm">Drop Cover Image Here</p>
          <p className="text-xs text-muted-foreground">Applies directly to 3D book model</p>
        </div>
      )}

      {/* Interactive 3D Control Bar: Smooth Rotation Buttons, Auto-Spin & Perspective Snapping */}
      <div className="absolute bottom-3 inset-x-0 mx-auto w-fit max-w-[92%] px-2 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/80 shadow-lg flex items-center gap-1 sm:gap-1.5 z-20 text-xs">
        
        {/* Manual Step Rotation */}
        <button
          type="button"
          onClick={rotateLeft}
          title="Rotate Left 45°"
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium transition cursor-pointer"
        >
          <RotateCcw className="size-3 text-gold" />
          <span className="hidden sm:inline">-45°</span>
        </button>

        <button
          type="button"
          onClick={rotateRight}
          title="Rotate Right 45°"
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium transition cursor-pointer"
        >
          <RotateCw className="size-3 text-gold" />
          <span className="hidden sm:inline">+45°</span>
        </button>

        <div className="h-4 w-px bg-border/80 mx-0.5" />

        {/* Auto-Spin Turntable Toggle */}
        <button
          type="button"
          onClick={() => setIsAutoRotating(!isAutoRotating)}
          title={isAutoRotating ? "Pause 360° Auto-Spin" : "Start continuous 360° Auto-Spin"}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            isAutoRotating 
              ? 'bg-gold text-black font-semibold shadow-xs' 
              : 'bg-secondary/80 hover:bg-secondary text-foreground'
          }`}
        >
          {isAutoRotating ? <Pause className="size-3" /> : <Play className="size-3 text-gold" />}
          <span>{isAutoRotating ? "Spinning" : "Auto-Spin"}</span>
        </button>

        <div className="h-4 w-px bg-border/80 mx-0.5" />

        {/* Quick Perspective Snaps */}
        <button
          type="button"
          onClick={() => setViewAngle(0)}
          title="View Front Cover"
          className="px-2 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition cursor-pointer"
        >
          Front
        </button>

        <button
          type="button"
          onClick={() => setViewAngle(Math.PI / 2)}
          title="View Spine"
          className="px-2 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition cursor-pointer"
        >
          Spine
        </button>

        <button
          type="button"
          onClick={() => setViewAngle(Math.PI)}
          title="View Back Cover"
          className="px-2 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition cursor-pointer"
        >
          Back
        </button>

        <div className="h-4 w-px bg-border/80 mx-0.5" />

        {/* Reset View */}
        <button
          type="button"
          onClick={resetView}
          title="Reset Camera & Angle"
          className="p-1 rounded-full bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <RefreshCw className="size-3" />
        </button>
      </div>
    </div>
  );
}

// --- Main View ---
export function WriterView() {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Config State
  const defaultSize = SIZES[1] ?? { name: "Trade Paperback (US)", inches: '6" × 9"', w: 152.4, h: 228.6 };
  const [selectedSize, setSelectedSize] = useState<BookSize>(defaultSize);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [unit, setUnit] = useState<MeasurementUnit>("mm");
  const [customWidthMm, setCustomWidthMm] = useState(152.4);
  const [customHeightMm, setCustomHeightMm] = useState(228.6);
  const [widthInputStr, setWidthInputStr] = useState("152.4");
  const [heightInputStr, setHeightInputStr] = useState("228.6");

  const [coverType, setCoverType] = useState<"paperback" | "hardcover">("paperback");
  const [gsm, setGsm] = useState<"50" | "70" | "80" | "100" | "120">("80");
  const [pageCount, setPageCount] = useState(250);
  const [title, setTitle] = useState("My Epic Novel");
  const [author, setAuthor] = useState("Author Name");
  
  const [isbn, setIsbn] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");

  const updateSelectedCustomSize = (wMm: number, hMm: number) => {
    setSelectedSize({
      name: "Custom Size",
      inches: `${(wMm / 25.4).toFixed(2)}" × ${(hMm / 25.4).toFixed(2)}"`,
      w: parseFloat(wMm.toFixed(2)),
      h: parseFloat(hMm.toFixed(2)),
    });
  };

  const handleUnitSwitch = (newUnit: MeasurementUnit) => {
    setUnit(newUnit);
    setWidthInputStr(formatDim(customWidthMm, newUnit, false));
    setHeightInputStr(formatDim(customHeightMm, newUnit, false));
  };

  const handleSelectPreset = (s: BookSize) => {
    setIsCustomSize(false);
    setSelectedSize(s);
  };

  const handleSelectCustom = () => {
    setIsCustomSize(true);
    updateSelectedCustomSize(customWidthMm, customHeightMm);
  };

  const handleWidthInputChange = (valStr: string) => {
    setWidthInputStr(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const mm = unit === "in" ? num * 25.4 : unit === "cm" ? num * 10 : num;
      setCustomWidthMm(mm);
      updateSelectedCustomSize(mm, customHeightMm);
    }
  };

  const handleHeightInputChange = (valStr: string) => {
    setHeightInputStr(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const mm = unit === "in" ? num * 25.4 : unit === "cm" ? num * 10 : num;
      setCustomHeightMm(mm);
      updateSelectedCustomSize(customWidthMm, mm);
    }
  };

  // Output State
  const [spineWidth, setSpineWidth] = useState(0);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [trimBleed, setTrimBleed] = useState(true);
  const [bleedCutMm, setBleedCutMm] = useState(3);
  const [coverFinish, setCoverFinish] = useState<"matte" | "glossy">("matte");

  // Live estimated dimensions
  const estimatedSpine = Math.max(3, (pageCount * (GSM_THICKNESS[gsm] ?? 0.0635)) + (coverType === 'hardcover' ? 6 : 0));
  const activeSpine = spineWidth > 0 ? spineWidth : parseFloat(estimatedSpine.toFixed(2));
  const totalCoverWidth = (selectedSize.w * 2 + activeSpine + 6).toFixed(1); // includes 3mm bleed each side
  const totalCoverHeight = (selectedSize.h + 6).toFixed(1); // includes 3mm bleed top & bottom

  // --- Handlers ---
  const handleGenerateAssets = async () => {
    setIsGenerating(true);
    setTemplateUrl(null);
    setBarcodeUrl(null);
    
    try {
      // 1. Fetch spine width
      const spineRes = await api.get(`/api/writer-desk/spine?pageCount=${pageCount}&gsm=${gsm}&coverType=${coverType}`);
      setSpineWidth(spineRes.data.spineWidth);

      // 2. Fetch template base64 (with selected unit)
      const templateRes = await api.post("/api/writer-desk/template", {
        trimWidth: selectedSize.w, trimHeight: selectedSize.h,
        pageCount, paperGSM: gsm, coverType, bookTitle: title, authorName: author,
        unit
      });
      setTemplateUrl(templateRes.data.base64);

      // 3. Fetch barcode base64 (if ISBN provided)
      if (isbn) {
        try {
          const barcodeRes = await api.post("/api/writer-desk/barcode", { isbn, price, currency });
          setBarcodeUrl(barcodeRes.data.base64);
        } catch (err) {
          console.error("Barcode generation failed", err);
          alert("Failed to generate barcode. Ensure ISBN is valid (10 or 13 digits).");
        }
      }

      setStage(2);
    } catch (error) {
      console.error("Error generating assets:", error);
      alert("Failed to calculate book specifications or generate template.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputTarget = e.target;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomCoverUrl(dataUrl);
        setStage(3);
      }
      inputTarget.value = '';
    };
    reader.onerror = () => {
      // Fallback to object URL if FileReader has an issue
      setCustomCoverUrl(URL.createObjectURL(file));
      setStage(3);
      inputTarget.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Writer Desk"
        title="Professional Book Production."
        description="Configure your book's physical specs, generate precise print-ready templates and barcodes, and visualize the final product in 3D."
      />

      {/* Widescreen optimized layout: max-w-7xl with fluid margins */}
      <div className="mx-auto mt-4 sm:mt-6 max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* --- Progress Steps (Compact, elegant) --- */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8">
          <button 
            type="button"
            onClick={() => setStage(1)}
            className={`flex items-center gap-2 transition-colors ${stage >= 1 ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border-2 transition-all ${stage >= 1 ? 'border-gold bg-gold/15 text-gold' : 'border-border'}`}>
              1
            </div>
            <span className="text-xs sm:text-sm font-medium">1. Configure</span>
          </button>
          
          <div className="h-px w-8 sm:w-16 bg-border" />
          
          <button 
            type="button"
            onClick={() => { if (spineWidth > 0 || stage > 1) setStage(2); }}
            disabled={stage < 2 && spineWidth === 0}
            className={`flex items-center gap-2 transition-colors ${stage >= 2 ? 'text-gold' : 'text-muted-foreground'} ${stage < 2 ? 'opacity-60 cursor-not-allowed' : 'hover:text-foreground'}`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border-2 transition-all ${stage >= 2 ? 'border-gold bg-gold/15 text-gold' : 'border-border'}`}>
              2
            </div>
            <span className="text-xs sm:text-sm font-medium">2. Get Assets</span>
          </button>

          <div className="h-px w-8 sm:w-16 bg-border" />

          <div className={`flex items-center gap-2 ${stage >= 3 ? 'text-gold' : 'text-muted-foreground opacity-60'}`}>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border-2 transition-all ${stage >= 3 ? 'border-gold bg-gold/15 text-gold' : 'border-border'}`}>
              3
            </div>
            <span className="text-xs sm:text-sm font-medium">3. 3D Preview</span>
          </div>
        </div>

        {/* --- Stage 1: Configure (Two-Column Widescreen Layout) --- */}
        {stage === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Left Column: Form Controls (8 cols on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              
              {/* Trim Dimensions Selection */}
              <Panel className="p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground">
                      <Ruler className="w-4 h-4 text-gold" /> Book Trim Sizes
                    </h2>
                    <span className="text-xs text-muted-foreground">Standard publishing industry or custom dimensions</span>
                  </div>

                  {/* Measurement Unit Selector */}
                  <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-md border border-border">
                    {(['mm', 'in', 'cm'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleUnitSwitch(u)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                          unit === u 
                            ? 'bg-gold text-black shadow-sm font-bold' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {u === 'in' ? 'inch' : u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {SIZES.map(s => {
                    const isSelected = !isCustomSize && selectedSize.name === s.name;
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleSelectPreset(s)}
                        className={`p-3 rounded-lg border text-left transition-all duration-200 relative ${
                          isSelected 
                            ? 'border-gold bg-gold/10 ring-1 ring-gold shadow-sm' 
                            : 'border-border bg-card/40 hover:border-gold/40 hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`font-semibold text-xs sm:text-sm ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                            {s.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />}
                        </div>
                        <div className="text-[11px] font-mono font-medium text-foreground mt-1">
                          {formatDim(s.w, unit)} × {formatDim(s.h, unit)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {unit === 'in' ? `${s.w} × ${s.h} mm` : s.inches}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Size Option Card */}
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 relative ${
                      isCustomSize 
                        ? 'border-gold bg-gold/10 ring-1 ring-gold shadow-sm' 
                        : 'border-border bg-card/40 hover:border-gold/40 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${isCustomSize ? 'text-gold' : 'text-foreground'}`}>
                        <Sliders className="size-3.5 text-gold" /> Custom Size
                      </span>
                      {isCustomSize && <Check className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />}
                    </div>
                    <div className="text-[11px] font-mono font-medium text-foreground mt-1">
                      {formatDim(customWidthMm, unit)} × {formatDim(customHeightMm, unit)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {unit === 'in' 
                        ? `${customWidthMm.toFixed(1)} × ${customHeightMm.toFixed(1)} mm` 
                        : `${(customWidthMm / 25.4).toFixed(2)}" × ${(customHeightMm / 25.4).toFixed(2)}"`}
                    </div>
                  </button>
                </div>

                {/* Custom Dimensions Editor */}
                {isCustomSize && (
                  <div className="mt-4 p-4 rounded-lg bg-background/80 border border-gold/40 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-gold" />
                        <span className="text-xs font-semibold text-foreground">
                          Custom Trim Dimensions ({unit === 'in' ? 'Inches' : unit})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Custom Width ({unit === 'in' ? 'Inches' : unit})
                          </label>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {unit === 'mm' 
                              ? `≈ ${(customWidthMm / 25.4).toFixed(2)} in • ${(customWidthMm / 10).toFixed(2)} cm`
                              : unit === 'in'
                                ? `≈ ${customWidthMm.toFixed(1)} mm • ${(customWidthMm / 10).toFixed(2)} cm`
                                : `≈ ${customWidthMm.toFixed(1)} mm • ${(customWidthMm / 25.4).toFixed(2)} in`}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={unit === 'in' ? 2 : unit === 'cm' ? 5 : 50}
                            max={unit === 'in' ? 20 : unit === 'cm' ? 50 : 500}
                            step={unit === 'in' ? "0.05" : unit === 'cm' ? "0.1" : "0.5"}
                            value={widthInputStr}
                            onChange={(e) => handleWidthInputChange(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-3 py-1.5 pr-12 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                            placeholder={unit === 'in' ? "6.0" : unit === 'cm' ? "15.0" : "150"}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gold font-mono font-semibold uppercase">
                            {unit === 'in' ? 'in' : unit}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Custom Height ({unit === 'in' ? 'Inches' : unit})
                          </label>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {unit === 'mm' 
                              ? `≈ ${(customHeightMm / 25.4).toFixed(2)} in • ${(customHeightMm / 10).toFixed(2)} cm`
                              : unit === 'in'
                                ? `≈ ${customHeightMm.toFixed(1)} mm • ${(customHeightMm / 10).toFixed(2)} cm`
                                : `≈ ${customHeightMm.toFixed(1)} mm • ${(customHeightMm / 25.4).toFixed(2)} in`}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={unit === 'in' ? 2 : unit === 'cm' ? 5 : 50}
                            max={unit === 'in' ? 24 : unit === 'cm' ? 60 : 600}
                            step={unit === 'in' ? "0.05" : unit === 'cm' ? "0.1" : "0.5"}
                            value={heightInputStr}
                            onChange={(e) => handleHeightInputChange(e.target.value)}
                            className="w-full bg-background border border-border rounded-md px-3 py-1.5 pr-12 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gold"
                            placeholder={unit === 'in' ? "9.0" : unit === 'cm' ? "22.0" : "220"}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gold font-mono font-semibold uppercase">
                            {unit === 'in' ? 'in' : unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Physical Properties & Metadata Subgrid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Physical Properties */}
                <Panel className="p-5 space-y-4">
                  <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground border-b border-border/60 pb-3">
                    <Book className="w-4 h-4 text-gold" /> Physical Properties
                  </h2>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Cover Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCoverType('paperback')}
                        className={`px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                          coverType === 'paperback' 
                            ? 'border-gold bg-gold/15 text-gold font-semibold shadow-sm' 
                            : 'border-border bg-background hover:bg-secondary/60 text-muted-foreground'
                        }`}
                      >
                        Paperback
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverType('hardcover')}
                        className={`px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                          coverType === 'hardcover' 
                            ? 'border-gold bg-gold/15 text-gold font-semibold shadow-sm' 
                            : 'border-border bg-background hover:bg-secondary/60 text-muted-foreground'
                        }`}
                      >
                        Hardcover (+6mm)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Paper Weight (GSM)</label>
                    <select 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                      value={gsm} 
                      onChange={e => setGsm(e.target.value as any)}
                    >
                      <option value="50">50 GSM — Novel standard / thin</option>
                      <option value="70">70 GSM — Trade standard</option>
                      <option value="80">80 GSM — High opacity trade</option>
                      <option value="100">100 GSM — Premium / Textbooks</option>
                      <option value="120">120 GSM — Art & photo books</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Total Page Count</label>
                      <span className="text-[11px] font-mono text-gold font-semibold">{pageCount} pages</span>
                    </div>
                    <input 
                      type="number" 
                      min="24" 
                      max="2000" 
                      value={pageCount} 
                      onChange={e => setPageCount(Math.max(24, parseInt(e.target.value) || 24))} 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Minimum 24 pages required for bound spine calculation.</p>
                  </div>
                </Panel>

                {/* Metadata & Barcode */}
                <Panel className="p-5 space-y-4">
                  <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground border-b border-border/60 pb-3">
                    <Barcode className="w-4 h-4 text-gold" /> Metadata & Barcode
                  </h2>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Book Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="e.g. GranthAstra Chronicles" 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Author Name</label>
                    <input 
                      type="text" 
                      value={author} 
                      onChange={e => setAuthor(e.target.value)} 
                      placeholder="e.g. Dr. H. Sharma" 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">ISBN-13 (Optional for Barcode)</label>
                    <input 
                      type="text" 
                      value={isbn} 
                      onChange={e => setIsbn(e.target.value)} 
                      placeholder="978-0-123456-47-2" 
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">Retail Price (Optional)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        placeholder="19.99" 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5" title="GS1/BISG Designated Bookland EAN Currencies">
                        Currency
                      </label>
                      <select 
                        value={currency} 
                        onChange={e => setCurrency(e.target.value)} 
                        className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold"
                        title="Bookland EAN barcode only supports officially designated GS1/BISG currencies"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code} title={`${c.label} (Lead digit: ${c.prefix})`}>
                            {c.code} ({c.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Only officially recognized Bookland EAN-5 currencies (<span className="text-foreground font-mono">USD, CAD, GBP, EUR, AUD, NZD</span>) are allowed for barcode price supplements per GS1 & BISG standards.
                  </p>
                </Panel>
              </div>
            </div>

            {/* Right Column: Live Specifications & Sticky Primary Action (4 cols on xl) */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-6 space-y-4">
                
                <Panel className="p-5 border-gold/40 bg-gradient-to-b from-card via-card to-card/90 shadow-md">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <Sparkles className="w-4 h-4 text-gold" /> Live Production Summary
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-gold/15 text-gold px-2 py-0.5 rounded font-semibold">
                      Auto-Calc
                    </span>
                  </div>

                  {/* 2D Wraparound Blueprint preview */}
                  <div className="mb-4 rounded-lg bg-background/60 border border-border/80 p-3">
                    <p className="text-[11px] text-muted-foreground font-medium mb-2 flex items-center justify-between">
                      <span>Cover Blueprint Layout</span>
                      <span className="text-[10px] text-gold font-mono">
                        {formatDim(parseFloat(totalCoverWidth), unit)} × {formatDim(parseFloat(totalCoverHeight), unit)}
                      </span>
                    </p>
                    <div className="flex h-16 w-full rounded border border-dashed border-gold/50 overflow-hidden text-[10px] font-mono text-center">
                      <div className="flex-1 bg-secondary/30 flex items-center justify-center border-r border-border text-muted-foreground px-1">
                        Back ({formatDim(selectedSize.w, unit)})
                      </div>
                      <div className="w-16 bg-gold/20 flex flex-col items-center justify-center border-r border-border text-gold font-semibold px-0.5">
                        <span className="text-[9px]">Spine</span>
                        <span>{formatDim(estimatedSpine, unit)}</span>
                      </div>
                      <div className="flex-1 bg-secondary/30 flex items-center justify-center text-muted-foreground px-1">
                        Front ({formatDim(selectedSize.w, unit)})
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 text-center mt-1.5">
                      Includes standard {formatDim(3, unit)} bleed & {formatDim(5, unit)} safe zones
                    </p>
                  </div>

                  {/* Specs List */}
                  <div className="space-y-2 text-xs divide-y divide-border/40">
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Trim Size</span>
                      <span className="font-medium text-foreground">{selectedSize.name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Trim Dimensions</span>
                      <span className="font-mono text-foreground">
                        {formatDim(selectedSize.w, unit)} × {formatDim(selectedSize.h, unit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Spine Thickness</span>
                      <span className="font-mono font-semibold text-gold">
                        ~{formatDim(estimatedSpine, unit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Binding Format</span>
                      <span className="font-medium text-foreground capitalize">{coverType}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">Paper Density</span>
                      <span className="font-medium text-foreground">{gsm} GSM ({pageCount} pp)</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-muted-foreground">ISBN Barcode</span>
                      <span className="font-medium text-foreground">{isbn ? 'Configured' : 'None (Optional)'}</span>
                    </div>
                  </div>

                  {/* Primary Action Button directly inside the sticky card! */}
                  <div className="mt-5 pt-3 border-t border-border">
                    <button 
                      type="button"
                      onClick={handleGenerateAssets}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 bg-gold text-black py-3 px-4 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gold/90 transition-all duration-200 shadow-md active:scale-[0.99] disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Settings className="w-4 h-4" />}
                      <span>{isGenerating ? "Calculating Specs & Template..." : "Generate Design Assets"}</span>
                    </button>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Instant vector PDF template & high-res barcode generation
                    </p>
                  </div>
                </Panel>
              </div>
            </div>

          </div>
        )}

        {/* --- Stage 2: Get Assets (3-Column Horizontal Grid on Widescreen) --- */}
        {stage === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Top Quick Summary Alert */}
            <Panel className="p-4 border-gold/40 bg-gold/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Specifications Calculated Successfully</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Spine is precisely <strong className="text-gold font-mono">{formatDim(spineWidth || activeSpine, unit)}</strong>. Full canvas dimensions: <strong className="text-foreground font-mono">{formatDim(parseFloat(totalCoverWidth), unit)} × {formatDim(parseFloat(totalCoverHeight), unit)}</strong> (with {formatDim(3, unit)} bleed).
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setStage(1)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors font-medium underline"
              >
                <ArrowLeft className="size-3.5" /> Edit Configuration
              </button>
            </Panel>

            {/* 3 Columns Side-by-Side: Template, Barcode, Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1: Cover Template PDF */}
              <Panel className="flex flex-col p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gold"/>
                    <h3 className="text-sm font-semibold">1. Cover Template (PDF)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Vector PDF</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Full wraparound with exact {formatDim(spineWidth || activeSpine, unit)} spine, {formatDim(3, unit)} outer bleed, and {formatDim(5, unit)} safe margins.
                </p>
                
                <div className="flex-1 w-full bg-muted/30 border border-border rounded-md overflow-hidden mb-3 relative aspect-[4/3] min-h-[180px]">
                  {templateUrl ? (
                    <iframe src={`${templateUrl}#toolbar=0&view=FitH`} className="w-full h-full border-0 absolute inset-0" title="Template Preview"/>
                  ) : (
                    <div className="flex-1 h-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/>
                    </div>
                  )}
                </div>

                <a 
                  href={templateUrl || "#"} 
                  download={`template-${selectedSize.name.replace(/\s+/g, '-').toLowerCase()}.pdf`} 
                  className={`w-full py-2 bg-secondary text-foreground border border-border rounded-md hover:bg-secondary/80 flex items-center justify-center gap-2 text-xs font-medium transition ${!templateUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download className="w-3.5 h-3.5"/> Download PDF Template
                </a>
              </Panel>

              {/* Card 2: ISBN Barcode */}
              <Panel className={`flex flex-col p-5 ${!isbn ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-gold"/>
                    <h3 className="text-sm font-semibold">2. ISBN Barcode (PNG)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">EAN-13</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {isbn ? `Print-ready barcode for ISBN ${isbn} with price tag.` : 'No ISBN provided in Step 1 (optional).'}
                </p>
                
                <div className="flex-1 w-full bg-white border border-border rounded-md overflow-hidden mb-3 flex items-center justify-center p-3 aspect-[4/3] min-h-[180px]">
                  {barcodeUrl ? (
                    <img src={barcodeUrl} alt="ISBN Barcode" className="max-w-full max-h-32 object-contain" />
                  ) : isbn ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground"/>
                  ) : (
                    <span className="text-xs text-muted-foreground">Barcode not requested</span>
                  )}
                </div>
                
                <a 
                  href={barcodeUrl || "#"} 
                  download={`barcode-${isbn}.png`} 
                  className={`w-full py-2 bg-secondary text-foreground border border-border rounded-md hover:bg-secondary/80 flex items-center justify-center gap-2 text-xs font-medium transition ${!barcodeUrl ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Download className="w-3.5 h-3.5"/> Download Barcode PNG
                </a>
              </Panel>

              {/* Card 3: Upload Final Design (Side-by-side with no vertical scrolling!) */}
              <Panel className="flex flex-col items-center justify-center border-dashed p-6 text-center bg-card/40">
                <div className="p-3 rounded-full bg-gold/10 text-gold mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold mb-1">3. Upload Final Cover</h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs">
                  Designed your cover with the template? Upload the flat image (PNG/JPG) to test fit and view your 3D mockup.
                </p>
                
                <input 
                  type="file" 
                  id="cover-upload" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  onChange={handleCoverUpload} 
                />
                <label 
                  htmlFor="cover-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 bg-gold text-black px-5 py-2.5 rounded-md font-semibold text-xs hover:bg-gold/90 transition shadow-sm"
                >
                  <UploadCloud className="size-4" />
                  <span>Upload & View 3D</span>
                </label>
              </Panel>

            </div>

          </div>
        )}

        {/* --- Stage 3: 3D Preview (Split Layout on Widescreen) --- */}
        {stage === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* 3D Canvas (Left 8 cols on desktop) */}
            <div className="lg:col-span-8 xl:col-span-9">
              <Panel className="p-0 overflow-hidden relative shadow-lg border-border/80">
                <BookViewer3D 
                  coverUrl={customCoverUrl} 
                  spineWidth={spineWidth || activeSpine} 
                  bookWidth={selectedSize.w} 
                  bookHeight={selectedSize.h} 
                  bleedMm={bleedCutMm}
                  trimBleed={trimBleed}
                  finish={coverFinish}
                  title={title}
                  author={author}
                  onCoverUpload={(url) => setCustomCoverUrl(url)}
                />
              </Panel>
            </div>

            {/* Production Spec Sheet & Actions (Right 4 cols on desktop) */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4">
              <Panel className="p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground">Production Verification</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">3D wrap preview check</p>
                </div>

                <div className="space-y-2 text-xs divide-y divide-border/40">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium text-foreground truncate max-w-[150px]">{title}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Author</span>
                    <span className="font-medium text-foreground truncate max-w-[150px]">{author}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Trim Size</span>
                    <span className="font-medium text-foreground">{selectedSize.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Trim Dimensions</span>
                    <span className="font-mono text-foreground">{formatDim(selectedSize.w, unit)} × {formatDim(selectedSize.h, unit)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Spine Width</span>
                    <span className="font-mono font-semibold text-gold">{formatDim(spineWidth || activeSpine, unit)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-medium text-foreground">{pageCount} ({gsm} GSM)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Cover Format</span>
                    <span className="font-medium text-foreground capitalize">{coverType}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Cover Finish</span>
                    <span className="font-medium text-foreground capitalize flex items-center gap-1.5 font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${coverFinish === 'glossy' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                      {coverFinish}
                    </span>
                  </div>
                </div>

                {/* Cover Finish Lamination Card */}
                <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Sparkles className="size-3.5 text-gold" />
                      <span>Cover Finish Lamination</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-gold/15 text-gold px-1.5 py-0.5 rounded font-semibold">
                      {coverFinish}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Select the lamination effect to test light reflection and sheen on your book cover.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCoverFinish("matte")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium border transition-all cursor-pointer ${
                        coverFinish === "matte"
                          ? "bg-gold text-black border-gold font-semibold shadow-xs"
                          : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Sparkles className="size-3.5" />
                      <span>Matte</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverFinish("glossy")}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-medium border transition-all cursor-pointer ${
                        coverFinish === "glossy"
                          ? "bg-gold text-black border-gold font-semibold shadow-xs"
                          : "bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Sun className="size-3.5" />
                      <span>Glossy</span>
                    </button>
                  </div>
                </div>

                {/* Template Bleed Trimming (Chopping) Control */}
                <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Scissors className="size-3.5 text-gold" />
                      <span>Chop Outer Bleed</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrimBleed(!trimBleed)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        trimBleed ? 'bg-gold' : 'bg-muted border border-border'
                      }`}
                      title={trimBleed ? "Bleed trimming active — click to turn OFF" : "Raw un-trimmed image — click to turn ON"}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        trimBleed ? 'translate-x-4' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {trimBleed 
                      ? "Trims the outer bleed, guide marks, and margins so only the pristine book cover wraps the 3D model."
                      : "Showing the full raw un-trimmed upload edge-to-edge (including outer bleed guidelines & margins)."}
                  </p>

                  {trimBleed && (
                    <div className="pt-2 space-y-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted-foreground font-medium">Cut Depth:</span>
                        <span className="font-mono font-semibold text-gold text-[11px]">
                          {formatDim(bleedCutMm, unit)} ({unit === 'in' ? `${bleedCutMm.toFixed(1)} mm` : `${(bleedCutMm / 25.4).toFixed(2)} in`})
                        </span>
                      </div>

                      {/* Dynamic Range Slider for instant real-time visual trimming */}
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={bleedCutMm}
                        onChange={(e) => setBleedCutMm(parseFloat(e.target.value))}
                        className="w-full accent-gold h-1.5 bg-secondary rounded-lg cursor-pointer"
                        title="Drag to dynamically adjust outer bleed cut depth"
                      />

                      {/* Quick Presets */}
                      <div className="grid grid-cols-4 gap-1 pt-0.5">
                        {[
                          { label: `3 mm`, val: 3, tip: "Standard Blueprint Bleed" },
                          { label: `6 mm`, val: 6, tip: "Wide / Safe Margin" },
                          { label: `10 mm`, val: 10, tip: "Template Guides Margin" },
                          { label: `15 mm`, val: 15, tip: "Hardcover Wrap" }
                        ].map(p => (
                          <button
                            key={p.val}
                            type="button"
                            onClick={() => setBleedCutMm(p.val)}
                            title={p.tip}
                            className={`py-1 rounded text-[10px] font-mono font-medium border text-center transition-all ${
                              bleedCutMm === p.val
                                ? 'bg-gold text-black border-gold font-bold shadow-xs'
                                : 'bg-secondary/70 border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 space-y-2">
                  <label className="cursor-pointer w-full flex items-center justify-center gap-2 border border-border bg-secondary text-foreground py-2.5 px-3 rounded-md text-xs font-medium hover:bg-secondary/80 transition">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} 
                      onChange={handleCoverUpload} 
                    />
                    <UploadCloud className="size-3.5 text-gold" />
                    <span>Upload Different Cover</span>
                  </label>

                  <button 
                    type="button"
                    onClick={() => setStage(2)}
                    className="w-full flex items-center justify-center gap-2 border border-border/80 bg-background text-foreground py-2 px-3 rounded-md text-xs font-medium hover:bg-secondary/60 transition"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Templates & Barcode</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStage(1)}
                    className="w-full text-center text-xs text-muted-foreground hover:text-gold transition py-1"
                  >
                    Reconfigure Dimensions
                  </button>
                </div>
              </Panel>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
