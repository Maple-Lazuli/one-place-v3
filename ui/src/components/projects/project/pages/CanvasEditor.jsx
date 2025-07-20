import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function DraggableImage({ imageSrc, x, y, isSelected, onSelect, onChange }) {
  const [image] = useImage(imageSrc);
  const shapeRef = useRef();

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      ref={shapeRef}
      onDragEnd={(e) => {
        onChange && onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = shapeRef.current;
        onChange && onChange({
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        });
      }}
    />
  );
}

export default function CanvasEditorOverlay({ onClose }) {
  const stageRef = useRef();
  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'pan'
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const lastPanPos = useRef(null);
  const lastPointerPos = useRef(null);

  // State to track if middle mouse button is pressed for panning
  const [middleMouseDown, setMiddleMouseDown] = useState(false);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const src = URL.createObjectURL(blob);
          const stage = stageRef.current;
          const rel = stage.getRelativePointerPosition();
          setImages((prev) => [...prev, { src, x: rel.x, y: rel.y }]);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();

    // Middle mouse button down (button === 1)
    if (e.evt.button === 1) {
      e.evt.preventDefault(); // Prevent default scroll behavior
      setMiddleMouseDown(true);
      lastPanPos.current = stage.getPointerPosition();
      return;
    }

    if (tool === 'pan') {
      lastPanPos.current = stage.getPointerPosition();
      return;
    }

    if (middleMouseDown) return; // Ignore drawing if middle button is down

    const pos = stage.getRelativePointerPosition();
    setDrawing(true);
    setLines((prev) => [
      ...prev,
      {
        points: [pos.x, pos.y],
        stroke: tool === 'eraser' ? '#f0f0f0' : strokeColor,
        strokeWidth,
      },
    ]);
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current;

    if (middleMouseDown) {
      // Pan the stage while middle mouse button is down
      const pointer = stage.getPointerPosition();
      const dx = pointer.x - lastPanPos.current.x;
      const dy = pointer.y - lastPanPos.current.y;
      setStagePosition((pos) => ({ x: pos.x + dx, y: pos.y + dy }));
      lastPanPos.current = pointer;
      return;
    }

    if (tool === 'pan' && lastPanPos.current) {
      const pointer = stage.getPointerPosition();
      const dx = pointer.x - lastPanPos.current.x;
      const dy = pointer.y - lastPanPos.current.y;
      setStagePosition((pos) => ({ x: pos.x + dx, y: pos.y + dy }));
      lastPanPos.current = pointer;
      return;
    }

    if (!drawing) return;

    const point = stage.getRelativePointerPosition();
    setLines((prevLines) => {
      const lastLine = prevLines[prevLines.length - 1];
      const newLines = prevLines.slice(0, -1);
      return [...newLines, { ...lastLine, points: [...lastLine.points, point.x, point.y] }];
    });
  };

  const handleMouseUp = (e) => {
    // If middle mouse button released
    if (e.evt.button === 1) {
      setMiddleMouseDown(false);
      lastPanPos.current = null;
      return;
    }

    if (drawing) {
      setDrawing(false);
      setHistory((prev) => [...prev, [...lines]]);
      setRedoStack([]);
    }
    lastPanPos.current = null;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = [...history];
    const last = prev.pop();
    setRedoStack((r) => [...r, lines]);
    setLines(last || []);
    setHistory(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const redo = [...redoStack];
    const restored = redo.pop();
    setHistory((h) => [...h, lines]);
    setLines(restored);
    setRedoStack(redo);
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const exportAsImage = async () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = uri;
    link.click();
  };

  const exportAsPDF = async () => {
    const canvas = stageRef.current.toCanvas();
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save('canvas.pdf');
  };

  const handleClear = () => {
    setLines([]);
    setImages([]);
    setHistory([]);
    setRedoStack([]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
      }}
    >
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1001 }}>
        {/* Tools */}
        <label>
          Color:{' '}
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </label>
        <label>
          Size:{' '}
          <input
            type="range"
            min="1"
            max="30"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
          />
        </label>
        <button onClick={() => setTool('pen')} style={{ fontWeight: tool === 'pen' ? 'bold' : 'normal' }}>
          Pencil
        </button>
        <button onClick={() => setTool('eraser')} style={{ fontWeight: tool === 'eraser' ? 'bold' : 'normal' }}>
          Eraser
        </button>
        <button onClick={() => setTool('pan')} style={{ fontWeight: tool === 'pan' ? 'bold' : 'normal' }}>
          Pan
        </button>
        <button onClick={handleUndo} disabled={history.length === 0}>
          Undo
        </button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo
        </button>
        <button onClick={exportAsImage}>Export Image</button>
        <button onClick={exportAsPDF}>Export PDF</button>
        <button onClick={handleClear}>Clear Canvas</button>
        <button onClick={onClose}>Close</button>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable={tool === 'pan' || middleMouseDown}
        style={{ backgroundColor: '#fff' }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.stroke === '#f0f0f0' ? 'destination-out' : 'source-over'}
            />
          ))}
          {images.map((img, i) => (
            <DraggableImage key={i} imageSrc={img.src} x={img.x} y={img.y} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
