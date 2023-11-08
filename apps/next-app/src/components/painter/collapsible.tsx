import { PropsWithChildren } from "react";
import { useState } from "react";

export function Collapsible(props: PropsWithChildren & {title: string} ) {
    const [collapsed, setCollapsed] = useState<boolean>(false);

    return (
        <>
            <button className="font-bold text-gray-50 cursor-pointer hover:text-slate-300 transition text-left"
                onClick={() => {
                    setCollapsed(!collapsed);
                }}>
                {props.title}
                { collapsed ? " ▶" : " ▼" }
            </button>
            <div className="flex flex-col gap-y-2 transition-all overflow-y-hidden"
                style={
                    collapsed ?
                    {
                        height: "0px",
                    } :
                    {
                        height: "107px", /* hardcoded 🤮 */
                    }
                }>
                {props.children}
            </div>
        </>
    )
}