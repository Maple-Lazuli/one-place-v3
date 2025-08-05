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
    { id, x, y, scaleX = 1, scaleY = 1, isSelected, onSelect, onChange, save },
    ref
  ) => {
    const inputDevice = useRef({type: ""})
    const imageUrl = `/api/images/image?id=${id}`
    const [image] = useImage(imageUrl)
    const shapeRef = useRef()

    useImperativeHandle(ref, () => shapeRef.current)

    useEffect(() => {
      if (isSelected && shapeRef.current) {
        if (inputDevice.type === 'touch') return
        shapeRef.current.draggable(true)
      }
    }, [isSelected])

    const handleDragMove = e => {
      if (inputDevice.type === 'touch') return

      // Otherwise, continue dragging
      onChange?.({
        x: e.target.x(),
        y: e.target.y()
      })
    }
    
    return (
      <KonvaImage
        image={image}
        x={x}
        y={y}
        scaleX={scaleX}
        scaleY={scaleY}
        onPointerDown={e => {
          const pointerType = e.evt.pointerType
          inputDevice.type = pointerType
          if (pointerType === "touch") return
          onSelect()
        }}
        draggable={inputDevice.type !== 'touch'}
        ref={shapeRef}
        onClick={onSelect}
        onDragMove={handleDragMove}
        onDragEnd={() => {save()}}
        onTransformEnd={e => {
          const node = shapeRef.current
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()

          node.scaleX(1)
          node.scaleY(1)

          onChange?.({
            x: node.x(),
            y: node.y(),
            scaleX,
            scaleY
          })
        save()
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
  console.log('sent save')
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
