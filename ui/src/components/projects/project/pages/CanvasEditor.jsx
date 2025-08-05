import React, { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Stage, Layer, Line, Transformer } from 'react-konva'

import Cookies from 'js-cookie'
import {
  Box,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'
import StrokeSizeStepper from '../StrokeSizeStepper'
import CanvasScaleControl from './CanvasScaleControl'
import {
  DraggableImage,
  uploadImage,
  deleteImageFromBackend,
  loadCanvas,
  saveCanvas
} from '../../../../utils/canvas.jsx'

// Draggable & transformable image with forwarded ref
import throttle from 'lodash/throttle'

export default function CanvasEditor () {
  const stageRef = useRef()
  const justLoadedRef = useRef(false)
  const transformerRef = useRef()
  const { project_id, page_id, canvas_id } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [tool, setTool] = useState('pen') // pen, eraser, pan
  const [lines, setLines] = useState([])
  const [images, setImages] = useState([])
  const [history, setHistory] = useState([])
  const [redoStack, setRedoStack] = useState([])
  const [drawing, setDrawing] = useState(false)
  const [strokeColor, setStrokeColor] = useState(
    Cookies.get('preferences') === 'dark' ? '#ffffff' : '#000000'
  )
  const [backgroundColor, setBackgroundColor] = useState(
    Cookies.get('preferences') === 'dark' ? '#111111' : '#ffffff'
  )
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [strokeWidth, setStrokeWidth] = useState(1.5)
  const [scale, setScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [middleMouseDown, setMiddleMouseDown] = useState(false)
  const autoSaveTimeout = 1000 // 500ms delay for auto-save
  // For transformer & selection
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const imageRefs = useRef([])

  const lastPanPos = useRef(null)
  const lastEditTimeRef = useRef(0)
  const lastSaveTimeRef = useRef(0)

  const throttledUpdateLine = useRef(
    throttle(newLine => {
      setLines(prevLines => {
        const lastLine = prevLines[prevLines.length - 1]
        const newLines = prevLines.slice(0, -1)
        return [
          ...newLines,
          { ...lastLine, points: [...lastLine.points, ...newLine] }
        ]
      })
    }, 5)
  ).current

  useEffect(() => {
    return () => {
      throttledUpdateLine.cancel()
    }
  }, [])

  const throttledPan = useRef(
    throttle((dx, dy, pointer) => {
      setStagePosition(pos => ({ x: pos.x + dx, y: pos.y + dy }))
      lastPanPos.current = pointer
    }, 5) // ~60fps
  ).current

  useEffect(() => {
    return () => {
      throttledPan.cancel()
    }
  }, [])

  useEffect(() => {
    justLoadedRef.current = true
    loadCanvas(canvas_id, setLines, setImages, setBackgroundColor)
  }, [canvas_id])

  const handleDeleteSelectedImage = () => {
    if (selectedImageIndex === null) return
    const imageToDelete = images[selectedImageIndex]
    setImages(prev => prev.filter((_, i) => i !== selectedImageIndex))
    setSelectedImageIndex(null)
    deleteImageFromBackend(imageToDelete.id)
    saveCanvas(canvas_id, lines, images, backgroundColor, lastSaveTimeRef)
  }

  useEffect(() => {
    const handlePaste = async e => {
      justLoadedRef.current = false

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
            saveCanvas(
              canvas_id,
              lines,
              images,
              backgroundColor,
              lastSaveTimeRef
            )
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
    if (transformerRef.current && selectedImageIndex !== null) {
      const selectedNode = imageRefs.current[selectedImageIndex]
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer().batchDraw()
      }
    }
    if (selectedImageIndex === null) {
      transformerRef.current?.nodes([])
      transformerRef.current?.getLayer()?.batchDraw()
      return
    }
  }, [selectedImageIndex])

  function updateImagePosition (index, changes) {
    setImages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...changes }
      return updated
    })
    if (!justLoadedRef.current) {
      // saveCanvas(canvas_id, lines, images, backgroundColor, lastSaveTimeRef)
    }
  }

  const handlePointerDown = e => {
    justLoadedRef.current = false
    const stage = e.target.getStage()

    // if the middle mouse was clicked or the canvas was touched.
    if (
      (e.evt.button === 1 && e.evt.pointerType === 'mouse') ||
      e.evt.pointerType == 'touch'
    ) {
      e.evt.preventDefault()
      setMiddleMouseDown(true)
      lastPanPos.current = stage.getPointerPosition()
      return
    }

    if (tool === 'pan') {
      lastPanPos.current = stage.getPointerPosition()
      return
    }

        //ensure an image was not clicked on.
    const clickedOnImage = imageRefs.current.some(
      imageNode => imageNode && imageNode === e.target
    )

    const transformer = transformerRef.current

    const clickedOnTransformer =
      transformer &&
      (transformer === e.target || transformer.isAncestorOf(e.target))

    // if an image was not selected, ensure all images are cleard.
    if (!clickedOnImage && !clickedOnTransformer) {
      setSelectedImageIndex(null)
    } else {
      // an image was selected?
      return
    }
    //if we are in a panning mode ensure that we do not draw.
    if (middleMouseDown) return

    const pos = stage.getRelativePointerPosition()

    setDrawing(true)

    setLines(prev => [
      ...prev,
      {
        points: [pos.x, pos.y],
        stroke:
          tool === 'eraser' ||
          (e.evt.button === 5 && e.evt.pointerType === 'pen')
            ? '#f0f0f0'
            : strokeColor, // Use background color for eraser
        strokeWidth:
          e.evt.button === 5 && e.evt.pointerType === 'pen'
            ? strokeWidth * 10
            : strokeWidth
      }
    ])

    const point = stage.getRelativePointerPosition()
    throttledUpdateLine([point.x, point.y])
  }

  const handleTouchMove = e => {
    const stage = stageRef.current
    if (!stage) return

    if (e.evt.touches.length === 2) {
      e.evt.preventDefault()
    } else if (drawing) {
      const point = stage.getRelativePointerPosition()

      throttledUpdateLine([point.x, point.y])
    }
  }

  const handlePointerMove = e => {
    const stage = stageRef.current
    if (!stage) return

    if (middleMouseDown || tool === 'pan') {
      const pointer = stage.getPointerPosition()
      const dx = pointer.x - lastPanPos.current.x
      const dy = pointer.y - lastPanPos.current.y

      throttledPan(dx, dy, pointer)
      return
    }

    if (!drawing) return

    const point = stage.getRelativePointerPosition()

    throttledUpdateLine([point.x, point.y])
  }

  //saving timeout
  useEffect(() => {
    if (drawing || justLoadedRef.current) return

    const timeout = setTimeout(async () => {
      setSaving(true)
      await saveCanvas(
        canvas_id,
        lines,
        images,
        backgroundColor,
        lastSaveTimeRef
      )
      setSaving(false)
    }, autoSaveTimeout)

    return () => clearTimeout(timeout)
  }, [drawing])

  const handleTouchEnd = e => {
    setMiddleMouseDown(false)
    if (drawing) {
      const stage = stageRef.current
      if (stage) {
        const point = stage.getRelativePointerPosition()
        throttledUpdateLine([point.x, point.y])
      }

      setDrawing(false)

      setHistory(prev => [...prev, [...lines]])

      setRedoStack([])
    }
    lastPanPos.current = null
  }

  const handlePointerUp = e => {
    if (
      (e.evt.button === 1 && e.evt.pointerType === 'mouse') ||
      (e.evt.button === 0 && e.evt.pointerType === 'touch')
    ) {
      setMiddleMouseDown(false)
      lastPanPos.current = null
      return
    }

    if (drawing) {
      const stage = stageRef.current
      if (stage) {
        const point = stage.getRelativePointerPosition()
        throttledUpdateLine([point.x, point.y])
      }

      setDrawing(false)

      setHistory(prev => [...prev, [...lines]])

      setRedoStack([])
    }
    lastPanPos.current = null
  }

  //implements pan
  const handleWheel = e => {
    e.evt.preventDefault() // Prevent default page scroll behavior

    const scaleBy = 1.05 // Zoom factor per wheel step
    const stage = stageRef.current
    const oldScale = stage.scaleX() // Assume uniform scaling on X and Y

    const pointer = stage.getPointerPosition() // Get current mouse position

    // Calculate the position of the mouse relative to the stage before scaling
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    }

    // Determine scroll direction: zoom in or out
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

    // Apply the new scale
    setScale(newScale)

    // Adjust stage position so zoom is centered on mouse pointer
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    })
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const prev = [...history]
    const last = prev.pop()
    setRedoStack(r => [...r, lines])
    setLines(last || [])
    setHistory(prev)
    saveCanvas(canvas_id, lines, images, backgroundColor, lastSaveTimeRef)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const redo = [...redoStack]
    const restored = redo.pop()
    setHistory(h => [...h, lines])
    setLines(restored)
    setRedoStack(redo)
    saveCanvas(canvas_id, lines, images, backgroundColor, lastSaveTimeRef)
  }

  const confirmClearCanvas = () => {
    setConfirmOpen(true)
  }

  const handleClearConfirmed = () => {
    setConfirmOpen(false)
    setLines([])
    setImages([])
    setHistory([])
    setRedoStack([])
    setSelectedImageIndex(null)
    saveCanvas(canvas_id, [], [], backgroundColor, lastSaveTimeRef)
  }

  //set last edit time when the lines or the images change
  useEffect(() => {
    lastEditTimeRef.current = Date.now()
  }, [lines, images])

  //Auto polling when not drawing.
  useEffect(() => {
    let interval = null

    async function pollCanvasUpdate () {
      if (drawing) {
        return
      }
      if (saving) {
        return
      }

      try {
        const res = await fetch(`/api/canvas/last_update?id=${canvas_id}`, {
          credentials: 'include'
        })
        const data = await res.json()

        if (res.ok && data.last_update && data.last_update !== 'Null') {
          const lastUpdate = Number(data.last_update) * 1000

          if (
            !drawing && //
            lastUpdate > lastEditTimeRef.current &&
            lastUpdate > lastSaveTimeRef.current
          ) {
            const canvasRes = await fetch(`/api/canvas/get?id=${canvas_id}`)
            if (canvasRes.ok) {
              const canvasData = await canvasRes.json()
              const parsed = JSON.parse(canvasData.message.content)
              setLines(parsed.lines || [])
              setImages(parsed.images || [])
              setBackgroundColor(parsed.backgroundColor || '#ffffff')
            }
          }
        }
      } catch (err) {
        console.error('Error checking canvas last update:', err)
      }
    }

    interval = setInterval(pollCanvasUpdate, 1500)

    return () => clearInterval(interval)
  }, [canvas_id, drawing])

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
      <Box
        sx={theme => ({
          position: 'absolute',
          top: 5,
          left: 5,
          zIndex: 1400,
          borderRadius: 2,
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,

          // Set the Box's text color from theme.primary.contrastText
          backgroundColor: theme.palette.background.default,
          color: theme.palette.primary,

          // For TextField inputs & labels inside, override default colors
          '& .MuiInputLabel-root': {
            color: theme.palette.primary
          },
          '& .MuiInputBase-input': {
            color: theme.palette.primary
          },

          // For ToggleButton text
          '& .MuiToggleButton-root': {
            color: theme.palette.primary,
            borderColor: theme.palette.primary
          },
          '& .MuiToggleButton-root.Mui-selected': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary
          },

          // For Buttons inside
          '& .MuiButton-root': {
            color: theme.palette.primary
          }
        })}
      >
        {/* Stroke Color Picker */}
        <TextField
          type='color'
          label='Color'
          onChange={e => setStrokeColor(e.target.value)}
          disabled={tool === 'eraser'}
          size='small'
          InputLabelProps={{ shrink: true }}
          sx={{ width: 80, color: 'primary' }}
        />

        {/* Background Color Picker */}
        <TextField
          type='color'
          label='Background'
          value={backgroundColor}
          onChange={e => setBackgroundColor(e.target.value)}
          size='small'
          InputLabelProps={{ shrink: true }}
          sx={{ width: 110 }}
        />

        {/* Stroke Width Slider */}
        <StrokeSizeStepper
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
        />

        {/* Tool Selector */}
        <ToggleButtonGroup
          value={tool}
          exclusive
          onChange={(e, newTool) => {
            if (newTool !== null) setTool(newTool)
          }}
          size='small'
        >
          <ToggleButton value='pen'>Pencil</ToggleButton>
          <ToggleButton value='eraser'>Eraser</ToggleButton>
          <ToggleButton value='pan'>Pan</ToggleButton>
        </ToggleButtonGroup>
        <CanvasScaleControl scale={scale} setScale={setScale} />
        {/* Action Buttons */}
        <Button onClick={handleUndo} disabled={history.length === 0}>
          Undo
        </Button>
        <Button onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo
        </Button>
        <Button onClick={confirmClearCanvas} color='error'>
          Clear
        </Button>
        <Button
          onClick={() =>
            navigate(
              `/projects/project/${project_id}/pages/page/${page_id}/canvases`
            )
          }
        >
          Close
        </Button>

        {/* Delete Selected Image */}
        {selectedImageIndex !== null && (
          <Button
            onClick={handleDeleteSelectedImage}
            sx={{ backgroundColor: 'red', color: 'white' }}
          >
            Delete Selected Image
          </Button>
        )}
      </Box>

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onTouchMove={handleTouchMove}
        onPointerUp={handlePointerUp}
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
              save={() => {saveCanvas(canvas_id, lines, images, backgroundColor, lastSaveTimeRef)}}
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
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Clear Canvas?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear the canvas? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleClearConfirmed} color='error'>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
