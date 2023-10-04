"use client"

import { useEffect, useState } from "react";
import { useDrawingLayer } from "../drawing-layer"
import { SegmentInformation } from "../drawing-layer";

export const ProgressTracker = () => {
    const drawingLayer = useDrawingLayer();

    const [segmentInfo, setSegmentInfo] = useState(drawingLayer.segmentInformation);

    useEffect(() => {
        const interval = setInterval(() => {
            // Perform a deep copy of the information to trigger an update:
            setSegmentInfo({
                ...drawingLayer.segmentInformation,
                segments: [...drawingLayer.segmentInformation.segments]
            });
        }, 250)

        return () => {
            clearInterval(interval)
        }
    }, []);

    return (
        <>
            <p> Segments ({segmentInfo.numSegments}): </p>
            <p> Filled {segmentInfo.numFilledPoints}/{segmentInfo.numTotalPoints} ({Math.round(segmentInfo.numFilledPoints/segmentInfo.numTotalPoints * 100)}%)</p>
            <ul>
                {
                    segmentInfo.segments.map((segment, id) => (
                        <li key={id} className="flex flex-row content-center">
                            <div style={{
                                width: 10,
                                height: 10,
                                backgroundColor: `#${segment.color.getHexString()}`
                            }} />
                            { segment.numPoints }
                        </li>
                    ))
                }
            </ul>
        </>
    )
}