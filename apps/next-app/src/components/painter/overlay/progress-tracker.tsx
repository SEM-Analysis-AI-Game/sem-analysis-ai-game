"use client"

import { useEffect, useState } from "react";
import { useDrawingLayer } from "../drawing-layer"

export const ProgressTracker = () => {
    const drawingLayer = useDrawingLayer();

    const [numSegments, setNumSegments] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setNumSegments(drawingLayer.getNumSegments());
        }, 250)

        return () => {
            clearInterval(interval)
        }
    }, []);

    return (
        <>
            <p> Segments Drawn: {numSegments} </p> 
        </>
    )
}