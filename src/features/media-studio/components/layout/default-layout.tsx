// import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components"
// import { Options } from "@/features/options"
// import { Timeline } from "@/features/timeline/components/timeline"
// import { useUserSettings } from "@/features/user-settings"
// import { VideoPlayer } from "@/features/video-player/components/video-player"

// ВРЕМЕННО: Показываем только Browser для тестирования
// function TopDefaultLayout() {
//   const { isOptionsVisible, isTimelineVisible, isBrowserVisible } = useUserSettings()

//   // Случай: только VideoPlayer (все панели скрыты)
//   if (!isOptionsVisible && !isBrowserVisible) {
//     return (
//       <div className="h-full flex-1">
//         <VideoPlayer />
//       </div>
//     )
//   }

//   // Случай: Browser + VideoPlayer (Options скрыт)
//   if (isBrowserVisible && !isOptionsVisible) {
//     return (
//       <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-1">
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
//           <div className="h-full flex-1">
//             <Browser />
//           </div>
//         </ResizablePanel>
//         <ResizableHandle />
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
//           <div className="h-full flex-1">
//             <VideoPlayer />
//           </div>
//         </ResizablePanel>
//       </ResizablePanelGroup>
//     )
//   }

//   // Случай: VideoPlayer + Options (Browser скрыт)
//   if (!isBrowserVisible && isOptionsVisible) {
//     return (
//       <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-2">
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
//           <div className="h-full flex-1">
//             <VideoPlayer />
//           </div>
//         </ResizablePanel>
//         <ResizableHandle />
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
//           <div className="h-full flex-1">
//             <Options />
//           </div>
//         </ResizablePanel>
//       </ResizablePanelGroup>
//     )
//   }

//   // Случай: Browser + VideoPlayer + Options (все видимы)
//   if (isBrowserVisible && isOptionsVisible) {
//     return (
//       <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-3">
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
//           <div className="h-full flex-1">
//             <Browser />
//           </div>
//         </ResizablePanel>
//         <ResizableHandle />
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
//           <div className="h-full flex-1">
//             <VideoPlayer />
//           </div>
//         </ResizablePanel>
//         <ResizableHandle />
//         <ResizablePanel defaultSize={50} minSize={20} maxSize={70}>
//           <div className="h-full flex-1">
//             <Options />
//           </div>
//         </ResizablePanel>
//       </ResizablePanelGroup>
//     )
//   }

//   // Fallback: только VideoPlayer
//   return (
//     <div className="h-full flex-1">
//       <VideoPlayer />
//     </div>
//   )
// }

export function DefaultLayout() {
  // const { isTimelineVisible } = useUserSettings()

  // ВРЕМЕННО: Показываем только Browser на весь экран
  return (
    <div className="h-full w-full flex-1">
      <Browser />
    </div>
  )

  // return (
  //   <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="default-layout-main">
  //     <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
  //       <TopDefaultLayout />
  //     </ResizablePanel>
  //     {isTimelineVisible ? (
  //       <>
  //         <ResizableHandle />
  //         <ResizablePanel
  //           defaultSize={20}
  //           minSize={20}
  //           maxSize={100}
  //           style={{
  //             transition: "width 0.3s ease-in-out",
  //           }}
  //         >
  //           <div className="h-full flex-1">
  //             <Timeline />
  //           </div>
  //         </ResizablePanel>
  //       </>
  //     ) : null}
  //   </ResizablePanelGroup>
  // )
}
