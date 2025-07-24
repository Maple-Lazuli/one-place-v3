import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Stage,
  Layer,
  Line,
  Image as KonvaImage,
  Transformer
} from 'react-konva'
import useImage from 'use-image'
import jsPDF from 'jspdf'
import Cookies from 'js-cookie'

// Draggable & transformable image with forwarded ref
const DraggableImage = forwardRef(
  (
    { id, x, y, scaleX = 1, scaleY = 1, isSelected, onSelect, onChange },
    ref
  ) => {
    const imageUrl = `/api/images/image?id=${id}`
    const [image] = useImage(imageUrl)
    const shapeRef = useRef()

    useImperativeHandle(ref, () => shapeRef.current)

    return (
      <KonvaImage
        image={image}
        x={x}
        y={y}
        scaleX={scaleX}
        scaleY={scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        onDragEnd={e => {
          onChange && onChange({ x: e.target.x(), y: e.target.y() })
        }}
        onTransformEnd={e => {
          const node = shapeRef.current
          onChange &&
            onChange({
              x: node.x(),
              y: node.y(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY()
            })
        }}
      />
    )
  }
)

export default function CanvasEditor () {
  const stageRef = useRef()
  const transformerRef = useRef()
  const { project_id, page_id, canvas_id } = useParams()
  const navigate = useNavigate()

  const [tool, setTool] = useState('pen') // pen, eraser, pan
  const [lines, setLines] = useState([])
  const [images, setImages] = useState([])
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [scale, setScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [middleMouseDown, setMiddleMouseDown] = useState(false)

  // For transformer & selection
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const imageRefs = useRef([])

  const lastPanPos = useRef(null)
  const lastEditTimeRef = useRef(Date.now())
  const lastSaveTimeRef = useRef(0)
  const [backgroundColor, setBackgroundColor] =  useState(
    Cookies.get('preferences') === 'dark' ? '#000000' : '#ffffff'
  )

  // Upload image to backend and get image ID
  async function uploadImage (blob) {
    const formData = new FormData()
    formData.append('file', blob)
    const res = await fetch('/api/images/image', {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error('Image upload failed')
    const data = await res.json()
    return data.id // backend should return { id: '...' }
  }

  // Load canvas content on mount
  useEffect(() => {
    async function loadCanvas () {
      try {
        const res = await fetch(`/api/canvas/get?id=${canvas_id}`)
        if (res.ok) {
          const data = await res.json()
          const parsed = JSON.parse(data.message.content)
          setLines(parsed.lines || [])
          setImages(parsed.images || [])
          setBackgroundColor(parsed.backgroundColor || '#ffffff')
        }
      } catch (e) {
        console.error('Failed to load canvas:', e)
      }
    }
    loadCanvas()
  }, [canvas_id])

  // Save canvas helper
  async function saveCanvas () {
    try {
      const payload = {
        canvas_id: Number(canvas_id),
        new_content: JSON.stringify({ lines, images, backgroundColor })
      }
      await fetch(`/api/canvas/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      lastSaveTimeRef.current = Date.now()
    } catch (e) {
      console.error('Failed to save canvas:', e)
    }
  }

  async function deleteImageFromBackend (imageId) {
    try {
      const res = await fetch(`/api/images/image?id=${imageId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        console.warn('Failed to delete image from backend')
      }
    } catch (e) {
      console.error('Error deleting image:', e)
    }
  }

  const handleDeleteSelectedImage = () => {
    if (selectedImageIndex === null) return
    const imageToDelete = images[selectedImageIndex]
    setImages(prev => prev.filter((_, i) => i !== selectedImageIndex))
    setSelectedImageIndex(null)
    deleteImageFromBackend(imageToDelete.id)
    saveCanvas()
  }

  useEffect(() => {
    const handlePaste = async e => {
      const items = e.clipboardData.items
      for (const item of items) {
        if (item.type.includes('image')) {
          const blob = item.getAsFile()
          try {
            const imageId = await uploadImage(blob)
            const stage = stageRef.current
            if (!stage) return
            const rel = stage.getRelativePointerPosition()
            setImages(prev => [
              ...prev,
              { id: imageId, x: rel.x, y: rel.y, scaleX: 1, scaleY: 1 }
            ])
            saveCanvas()
          } catch (err) {
            console.error('Image upload failed:', err)
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  useEffect(() => {
    if (selectedImageIndex === null) {
      transformerRef.current?.nodes([])
      transformerRef.current?.getLayer()?.batchDraw()
      return
    }
    const selectedNode = imageRefs.current[selectedImageIndex]
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode])
      transformerRef.current.getLayer().batchDraw()
    }
  }, [selectedImageIndex])

  const handleTouchStart = e => {
    const stage = stageRef.current
    const touch = e.evt.touches[0]
    const pos = stage.getPointerPosition()
    lastPanPos.current = pos

    if (tool === 'pan') return

    setDrawing(true)
    setLines(prev => [
      ...prev,
      {
        points: [pos.x, pos.y],
        stroke: tool === 'eraser' ? '#f0f0f0' : strokeColor,
        strokeWidth
      }
    ])
    setSelectedImageIndex(null)
  }

  const handleTouchMove = e => {
    const stage = stageRef.current
    const pos = stage.getPointerPosition()

    if (!pos) return

    if (tool === 'pan') {
      const dx = pos.x - lastPanPos.current.x
      const dy = pos.y - lastPanPos.current.y
      setStagePosition(prev => ({ x: prev.x + dx, y: prev.y + dy }))
      lastPanPos.current = pos
      return
    }

    if (!drawing) return

    setLines(prevLines => {
      const lastLine = prevLines[prevLines.length - 1]
      const newLines = prevLines.slice(0, -1)
      return [
        ...newLines,
        { ...lastLine, points: [...lastLine.points, pos.x, pos.y] }
      ]
    })
  }

  const handleTouchEnd = () => {
    if (drawing) {
      setDrawing(false)
      setHistory(prev => [...prev, [...lines]])
      setRedoStack([])
      saveCanvas()
    }
    lastPanPos.current = null
  }

  function updateImagePosition (index, changes) {
    setImages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...changes }
      return updated
    })
    saveCanvas()
  }

  const handleMouseDown = e => {
    const stage = e.target.getStage()
    if (e.evt.button === 1) {
      e.evt.preventDefault()
      setMiddleMouseDown(true)
      lastPanPos.current = stage.getPointerPosition()
      return
    }
    if (tool === 'pan') {
      lastPanPos.current = stage.getPointerPosition()
      return
    }
    if (middleMouseDown) return
    const pos = stage.getRelativePointerPosition()
    setDrawing(true)
    setLines(prev => [
      ...prev,
      {
        points: [pos.x, pos.y],
        stroke: tool === 'eraser' ? '#f0f0f0' : strokeColor,
        strokeWidth
      }
    ])
    setSelectedImageIndex(null)
  }

  const handleMouseMove = e => {
    const stage = stageRef.current
    if (!stage) return

    if (middleMouseDown || tool === 'pan') {
      const pointer = stage.getPointerPosition()
      const dx = pointer.x - lastPanPos.current.x
      const dy = pointer.y - lastPanPos.current.y
      setStagePosition(pos => ({ x: pos.x + dx, y: pos.y + dy }))
      lastPanPos.current = pointer
      return
    }

    if (!drawing) return

    const point = stage.getRelativePointerPosition()
    setLines(prevLines => {
      const lastLine = prevLines[prevLines.length - 1]
      const newLines = prevLines.slice(0, -1)
      return [
        ...newLines,
        { ...lastLine, points: [...lastLine.points, point.x, point.y] }
      ]
    })
  }

  const handleMouseUp = e => {
    if (e.evt.button === 1) {
      setMiddleMouseDown(false)
      lastPanPos.current = null
      return
    }
    if (drawing) {
      setDrawing(false)
      setHistory(prev => [...prev, [...lines]])
      setRedoStack([])
      saveCanvas()
    }
    lastPanPos.current = null
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const prev = [...history]
    const last = prev.pop()
    setRedoStack(r => [...r, lines])
    setLines(last || [])
    setHistory(prev)
    saveCanvas()
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const redo = [...redoStack]
    const restored = redo.pop()
    setHistory(h => [...h, lines])
    setLines(restored)
    setRedoStack(redo)
    saveCanvas()
  }

  const handleWheel = e => {
    e.evt.preventDefault()
    const scaleBy = 1.05
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    }

    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

    setScale(newScale)
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    })
  }

  const exportAsImage = () => {
    const uri = stageRef.current.toDataURL()
    const link = document.createElement('a')
    link.download = 'canvas.png'
    link.href = uri
    link.click()
  }

  const exportAsPDF = () => {
    const canvas = stageRef.current.toCanvas()
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
    pdf.save('canvas.pdf')
  }

  const handleClear = () => {
    setLines([])
    setImages([])
    setHistory([])
    setRedoStack([])
    setSelectedImageIndex(null)
    saveCanvas()
  }

  useEffect(() => {
    lastEditTimeRef.current = Date.now()
  }, [lines, images])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/canvas/last_update?id=${canvas_id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update) * 1000
          if (
            lastUpdate > lastEditTimeRef.current &&
            lastUpdate > lastSaveTimeRef.current
          ) {
            const canvasRes = await fetch(`/api/canvas/get?id=${canvas_id}`)
            if (canvasRes.ok) {
              const canvasData = await canvasRes.json()
              const parsed = JSON.parse(canvasData.message.content)
              setLines(parsed.lines || [])
              setImages(parsed.images || [])
            }
          }
        }
      } catch (err) {
        console.error('Error checking canvas last update:', err)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [canvas_id])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1300,
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 6,
          padding: 8,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <label>
          Color:{' '}
          <input
            type='color'
            value={strokeColor}
            onChange={e => setStrokeColor(e.target.value)}
            disabled={tool === 'eraser'}
          />
        </label>
        <label>
          Background:{' '}
          <input
            type='color'
            value={backgroundColor}
            onChange={e => setBackgroundColor(e.target.value)}
          />
        </label>
        <label>
          Size:{' '}
          <input
            type='range'
            min='1'
            max='30'
            value={strokeWidth}
            onChange={e => setStrokeWidth(parseInt(e.target.value, 10))}
          />
        </label>
        <button
          onClick={() => setTool('pen')}
          style={{ fontWeight: tool === 'pen' ? 'bold' : 'normal' }}
        >
          Pencil
        </button>
        <button
          onClick={() => setTool('eraser')}
          style={{ fontWeight: tool === 'eraser' ? 'bold' : 'normal' }}
        >
          Eraser
        </button>
        <button
          onClick={() => setTool('pan')}
          style={{ fontWeight: tool === 'pan' ? 'bold' : 'normal' }}
        >
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
        <button
          onClick={() =>
            navigate(
              `/projects/project/${project_id}/pages/page/${page_id}/canvases`
            )
          }
        >
          Close
        </button>

        {selectedImageIndex !== null && (
          <button
            onClick={handleDeleteSelectedImage}
            style={{ backgroundColor: 'red', color: 'white' }}
          >
            Delete Selected Image
          </button>
        )}
      </div>

      {/* Canvas Stage */}
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={tool === 'pan' || middleMouseDown}
        style={{ backgroundColor: backgroundColor, flexGrow: 1 }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap='round'
              lineJoin='round'
              globalCompositeOperation={
                line.stroke === '#f0f0f0' ? 'destination-out' : 'source-over'
              }
            />
          ))}
          {images.map((img, i) => (
            <DraggableImage
              key={img.id}
              id={img.id}
              x={img.x}
              y={img.y}
              scaleX={img.scaleX || 1}
              scaleY={img.scaleY || 1}
              isSelected={selectedImageIndex === i}
              onSelect={() => setSelectedImageIndex(i)}
              onChange={changes => updateImagePosition(i, changes)}
              ref={el => (imageRefs.current[i] = el)}
            />
          ))}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right'
            ]}
          />
        </Layer>
      </Stage>
    </div>
  )
}
