"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { showToast } from "@/components/ui/toast";
import { z } from "zod";
import { subscribeAction } from "@/app/actions/subscribe";
import { emailSchema } from "@/lib/validations/auth";
const schema=z.object({email:emailSchema});
export function SubscribeForm(){const[pending,startTransition]=useTransition();const{register,handleSubmit,formState:{errors}}=useForm<z.infer<typeof schema>>({resolver:zodResolver(schema)});return <form onSubmit={handleSubmit(({email})=>startTransition(async()=>{const result=await subscribeAction(email);showToast(result.message,result.success?"success":"error");}))} className="min-w-0 sm:w-[320px]" noValidate><div className="flex gap-2"><input aria-label="E-posta adresiniz" type="email" placeholder="e-posta adresiniz" className="h-11 min-w-0 flex-1 rounded-full bg-[#1f1f1f] px-[18px] text-sm font-medium text-white outline-none placeholder:text-[#8a8a8a] focus:ring-2 focus:ring-white" {...register("email")} /><button disabled={pending} className="h-11 shrink-0 rounded-full bg-white px-5 text-sm font-semibold text-[#0a0a0a] disabled:opacity-50">{pending?"…":"Katıl"}</button></div>{errors.email?.message?<p aria-live="polite" className="mt-2 text-xs text-[#a1a1a1]">{errors.email.message}</p>:null}</form>}
