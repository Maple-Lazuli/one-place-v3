import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
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
  const containerRef = useRef(null);
  const stageRef = useRef();

  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'pan'
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [images, setImages] = useState([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const lastPanPos = useRef(null);

  const [middleMouseDown, setMiddleMouseDown] = useState(false);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update container size on mount and resize
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const src = URL.createObjectURL(blob);
          const stage = stageRef.current;
          if (!stage) return;
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

    if (e.evt.button === 1) {
      e.evt.preventDefault();
      setMiddleMouseDown(true);
      lastPanPos.current = stage.getPointerPosition();
      return;
    }

    if (tool === 'pan') {
      lastPanPos.current = stage.getPointerPosition();
      return;
    }

    if (middleMouseDown) return;

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
        top: 0, left: 0, bottom: 0, right: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '95vw',
          height: '95vh',
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1001 }}>
          <label>
            Color:{' '}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              disabled={tool === 'eraser'}
            />
          </label>
          <label style={{ marginLeft: 10 }}>
            Size:{' '}
            <input
              type="range"
              min="1"
              max="30"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
            />
          </label>
          <button onClick={() => setTool('pen')} style={{ fontWeight: tool === 'pen' ? 'bold' : 'normal', marginLeft: 10 }}>
            Pencil
          </button>
          <button onClick={() => setTool('eraser')} style={{ fontWeight: tool === 'eraser' ? 'bold' : 'normal', marginLeft: 10 }}>
            Eraser
          </button>
          <button onClick={() => setTool('pan')} style={{ fontWeight: tool === 'pan' ? 'bold' : 'normal', marginLeft: 10 }}>
            Pan
          </button>
          <button onClick={handleUndo} disabled={history.length === 0} style={{ marginLeft: 10 }}>
            Undo
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} style={{ marginLeft: 10 }}>
            Redo
          </button>
          <button onClick={exportAsImage} style={{ marginLeft: 10 }}>
            Export Image
          </button>
          <button onClick={exportAsPDF} style={{ marginLeft: 10 }}>
            Export PDF
          </button>
          <button onClick={handleClear} style={{ marginLeft: 10 }}>
            Clear Canvas
          </button>
        </div>

        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          scaleX={scale}
          scaleY={scale}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          draggable={tool === 'pan' || middleMouseDown}
          style={{ backgroundColor: '#fff', flexGrow: 1 }}
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
    </div>
  );
}
