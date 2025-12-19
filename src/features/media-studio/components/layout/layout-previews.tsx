import { useUserSettings } from "@/features/user-settings"

import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layouts-markup"

export function LayoutPreviews() {
  const { layoutMode, handleLayoutChange } = useUserSettings()

  return (
    <div className="flex flex-col gap-2" data-oid="d8xo7c2">
      <div className="flex justify-around gap-2" data-oid="ehfjc.g">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => {
            handleLayoutChange("default")
          }}
          data-oid="94xa-.j"
        />

        <OptionsLayout
          isActive={layoutMode === "options"}
          onClick={() => {
            handleLayoutChange("options")
          }}
          data-oid="2_t:06:"
        />
      </div>
      <div className="flex justify-around gap-2" data-oid="3-aquwt">
        <VerticalLayout
          isActive={layoutMode === "vertical"}
          onClick={() => {
            handleLayoutChange("vertical")
          }}
          data-oid="ro63_5v"
        />

        <ChatLayout
          isActive={layoutMode === "chat"}
          onClick={() => {
            handleLayoutChange("chat")
          }}
          data-oid="dttv__r"
        />
      </div>
    </div>
  )
}
