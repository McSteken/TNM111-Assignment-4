'use client'

import Image from "next/image";
import Graph from "./components/graph";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-0 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center justify-items-center">
        
        <h1 className="text-4xl font-bold text-center ">Star Wars Interaction Visualization</h1>
        <div className="flex flex-row">
          <Graph />
        </div>

      </main>
    </div>
  );
}
