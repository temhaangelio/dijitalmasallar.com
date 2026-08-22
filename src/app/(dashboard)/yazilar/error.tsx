"use client";
import { ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="p-8"><ErrorState /><Button className="mt-4" onClick={reset}>Yeniden dene</Button></div>; }
