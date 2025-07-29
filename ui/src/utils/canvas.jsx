import {
  React,
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect
} from 'react'
import {
  Stage,
  Layer,
  Line,
  Image as KonvaImage,
  Transformer
} from 'react-konva'
import useImage from 'use-image'

export const DraggableImage = forwardRef(
  (
    { id, x, y, scaleX = 1, scaleY = 1, isSelected, onSelect, onChange },
    ref
  ) => {
    const imageUrl = `/api/images/image?id=${id}`
    const [image] = useImage(imageUrl)
    const shapeRef = useRef()

    useImperativeHandle(ref, () => shapeRef.current)

    useEffect(() => {
      if (isSelected && shapeRef.current) {
        shapeRef.current.draggable(true)
      }
    }, [isSelected])

    return (
      <KonvaImage
        image={image}
        x={x}
        y={y}
        scaleX={scaleX}
        scaleY={scaleY}
        draggable
        ref={shapeRef}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={e => {
          onChange &&
            onChange({
              x: e.target.x(),
              y: e.target.y()
            })
        }}
        onTransformEnd={e => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          console.log('Transform scale', scaleX, scaleY)

          node.scaleX(1)
          node.scaleY(1)

          onChange?.({
            x: node.x(),
            y: node.y(),
            scaleX,
            scaleY
          })
        }}
      />
    )
  }
)

export async function uploadImage (blob) {
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

export async function deleteImageFromBackend (imageId) {
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

export const exportAsImage = stageRef => {
  const uri = stageRef.current.toDataURL()
  const link = document.createElement('a')
  link.download = 'canvas.png'
  link.href = uri
  link.click()
}

export const exportAsPDF = stageRef => {
  const canvas = stageRef.current.toCanvas()
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF()
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
  pdf.save('canvas.pdf')
}

export async function loadCanvas (
  canvas_id,
  setLines,
  setImages,
  setBackgroundColor
) {
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

export async function saveCanvas (
  canvas_id,
  lines,
  images,
  backgroundColor,
  lastSaveTimeRef
) {
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
    lastSaveTimeRef.current = new Date(Date.now() + 30000)
  } catch (e) {
    console.error('Failed to save canvas:', e)
  }
}
