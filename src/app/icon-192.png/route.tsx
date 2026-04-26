import { ImageResponse } from 'next/og';
export const runtime='edge';
export async function GET(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f7f5',fontSize:88,fontWeight:700,color:'#111827',borderRadius:48}}>K</div>,{width:192,height:192});} 