import { meydanApi, plainText } from "@/lib/meydan-api";
import type { MediaReflection, PostComment, PostDetail, PostMedia } from "../types";

type ApiActor = { id: string; type?: "user" | "square"; display_name: string; avatar_url?: string; verified?: boolean; verified_speaker?: boolean };
type ApiAttachment = { id: number; type?: string; label?: string; filename?: string; url?: string; width?: number; height?: number };
type ApiReflection = {
  id: number;
  outlet: string;
  outlet_id?: number;
  outlet_detail?: {
    id?: number;
    name?: string;
    avatar_url?: string;
    website?: string;
    bale?: string;
    eitaa?: string;
  } | null;
  title?: string;
  summary?: string;
  url?: string;
  link?: string;
  source_url?: string;
  avatar_url?: string;
  logo_url?: string;
  outlet_avatar_url?: string;
  outlet_logo_url?: string;
};
type ApiNarrative = { id: number; author: ApiActor; body: string; published_at?: string | null; attachments?: ApiAttachment[]; tags?: string[]; media_reflections?: ApiReflection[]; stats?: { likes?: number; reposts?: number; comments?: number; views?: number }; viewer_state?: { liked?: boolean; reposted?: boolean } | null };
type ApiComment = { id: number; author?: ApiActor | null; body: string; created_at?: string | null };

function relativeFa(value?: string | null) { if (!value) return ""; const then = new Date(value).getTime(); if (!Number.isFinite(then)) return ""; const minutes = Math.max(1, Math.round((Date.now()-then)/60000)); const n = new Intl.NumberFormat("fa-IR"); if (minutes < 60) return `${n.format(minutes)} دقیقه پیش`; const hours=Math.round(minutes/60); return hours < 24 ? `${n.format(hours)} ساعت پیش` : `${n.format(Math.round(hours/24))} روز پیش`; }
function initials(name:string){ return name.split(/\s+/).filter(Boolean).slice(-2).map(p=>p[0]).join("."); }
function mediaKind(type?:string):PostMedia["kind"] { if(type==="image") return "image"; if(type==="video") return "video"; if(type==="audio") return "microphone"; return "article"; }
function accent(index:number):MediaReflection["accent"] { return (["blue","emerald","amber","red"] as const)[index%4]; }
function numericActorId(value?:string){ const match=(value||"").match(/(?:sq_|u_)?(\d+)$/); return Number(match?.[1]||0); }

export async function getPostById(postId:string):Promise<PostDetail|null>{
 if(!/^\d+$/.test(postId)) return null;
 try{
  const post=await meydanApi<ApiNarrative>(`/narratives/${postId}`);
  let comments:ApiComment[]=[];
  try{ comments=await meydanApi<ApiComment[]>(`/narratives/${postId}/comments`); }catch{}
  const authorName=post.author?.display_name||"میدان";
  return { id:String(post.id), author:{ id:numericActorId(post.author?.id), type:post.author?.type||"square", name:authorName, handle:post.author?.id||"meydan", initials:initials(authorName), verified:Boolean(post.author?.verified), verifiedSpeaker:Boolean(post.author?.verified_speaker), avatarUrl:post.author?.avatar_url }, outlet:post.media_reflections?.[0]?.outlet||"روایت میدان", badge:post.tags?.[0]||"روایت میدان", timeAgo:relativeFa(post.published_at), body:plainText(post.body||""), media:(post.attachments||[]).map(item=>({id:String(item.id),label:item.label||item.filename||"پیوست",kind:mediaKind(item.type),detail:item.type||"فایل",previewSrc:item.type==="image"||item.type==="video"?item.url:undefined,audioSrc:item.type==="audio"?item.url:undefined,previewAlt:item.label||authorName,width:item.width,height:item.height})), reflections:(post.media_reflections||[]).map((item,index)=>({id:String(item.id),outlet:item.outlet||item.outlet_detail?.name||"خبرگزاری",title:item.title?.trim()||item.summary?.trim()||"",summary:item.summary?.trim()||item.title?.trim()||"",accent:accent(index),url:item.url||item.link||item.source_url,avatarUrl:item.outlet_detail?.avatar_url||item.outlet_avatar_url||item.outlet_logo_url||item.avatar_url||item.logo_url})), likes:post.stats?.likes||0,reposts:post.stats?.reposts||0,views:post.stats?.views||0,commentsCount:post.stats?.comments||0,viewerState:{liked:Boolean(post.viewer_state?.liked),reposted:Boolean(post.viewer_state?.reposted)}, comments:comments.map((item):PostComment=>{ const name=item.author?.display_name||"کاربر میدان"; return {id:String(item.id),author:name,authorId:numericActorId(item.author?.id),authorType:item.author?.type||"user",verified:Boolean(item.author?.verified),initials:initials(name),timeAgo:relativeFa(item.created_at),content:plainText(item.body||""),isAuthor:item.author?.id===post.author?.id,avatarUrl:item.author?.avatar_url}; })};
 }catch{return null;}
}
