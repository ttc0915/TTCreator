import { NextResponse } from 'next/server';

export async function GET() {
  // 直接写死视频链接数组
  const videoUrls = [
    'https://v16-cc.capcut.com/54e97172ae2f6d77c74e000ffa7a0bc9/687dbca0/video/tos/alisg/tos-alisg-ve-14178-sg/owuCBufDQQiMJ3o2hAwyrdMIpBfNyEHOFgPyIg/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12422&bt=6211&cs=0&ft=GAAO2Inz7Th5d.WKXq8Zmo&mime_type=video_mp4&qs=0&rc=ZDU3ZjY5ZTRlMzVpZmY7O0Bpajl3O2s5cnY7NDYzODU6NEAyYl8uNmIxNjQxMV8uMjJgYSNga141MmRrMG5hLS1kMy1zcw%3D%3D&vvpl=1&l=202507141205424EF4BC0A29979645B790&btag=e000b0000',
    'https://v16-cc.capcut.com/ade3eb530d7c62a3b100db1d3562a50c/687ce488/video/tos/alisg/tos-alisg-ve-14178-sg/o0aqcQHeoVBop7dzBhFEgnDD2cNJdsjEIzfsQ6/?a=513641&bti=PDk6QC0yM2A%3D&ch=0&cr=0&dr=0&er=0&cd=0%7C0%7C0%7C0&br=12322&bt=6161&cs=0&ft=GAAO2Inz7Thu.cmKXq8Zmo&mime_type=video_mp4&qs=0&rc=ZmQzOjY8aDc7Zjc7ZWU6NUBpM3d1dWo5cmp0NDYzODU6NEBeLy00MmAzXzAxYC0xNS5gYSNzYDZwMmRzZ21hLS1kMy1zcw%3D%3D&vvpl=1&l=20250713204342CC290776B7D01AC174A3&btag=e000b0000',
    // 可以继续添加更多视频链接
  ];
  return NextResponse.json(videoUrls);
} 