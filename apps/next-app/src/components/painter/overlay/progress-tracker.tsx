"use client"

import { useDrawingLayer } from "../drawing-layer"

export const ProgressTracker = () => {
    const drawingLayer = useDrawingLayer();

    return (
        <>
            <p> Segments Drawn: {drawingLayer.getNumSegments()} </p> 
        </>
    )
}