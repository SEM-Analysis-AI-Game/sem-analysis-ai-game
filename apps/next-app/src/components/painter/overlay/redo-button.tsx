"use client";

import { useActionHistory } from "../action-history";

export function RedoButton(): JSX.Element {
    const history = useActionHistory();

    return (
        <button
            className="text-[#333] bg-slate-100 rounded pl-2 pr-2 mt-1 mb-1 border-black border-2"
            key="undo-button"  
            onClick={() => history.redo()}  
        >
            Redo
        </button>
    );
}