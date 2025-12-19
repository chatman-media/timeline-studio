import { MessageCircle, Play } from "lucide-react"
import { useTranslation } from "react-i18next"

interface LayoutProps {
  isActive: boolean
  onClick: () => void
}

export function DefaultLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
      data-oid="wboiwwq"
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700" data-oid="09f2e0b">
        <div className="flex h-full w-[100%] flex-col" data-oid="fz8-hft">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700" data-oid="40u916l">
            <div className="w-[30%] border-r-2 border-gray-700 p-1" data-oid="oi89one">
              <div className="w-full" data-oid="p_az2ce">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="lf:l1cb">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="9dq5f23" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="36x0hvj" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="vv:cht0">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="ub:jd6u" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="85dsijo" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="jt5ip9z">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid=":0br_vz" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="cyzlkm6" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700" data-oid="ltr-134">
              <div
                className="bg-muted flex h-[90%] w-[95%] items-center justify-center border-2 border-gray-700"
                data-oid="ense:4y"
              >
                <Play className="text-primary h-3 w-3" data-oid="c4ls3_j" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full" data-oid="io72589">
            <div className="w-[20%] border-r-2 border-gray-700 p-1" data-oid="9-a0rk3">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="-9:ohge" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="4:b8y60" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="dvkg_q." />
            </div>
            <div className="relative w-[60%] border-r-2 px-2 py-1" data-oid="v:my7ud">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" data-oid="tyrllna" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" data-oid="i-03sfv" />
            </div>
            <div className="w-[20%] border-gray-700 p-1" data-oid="mcnpcb8">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" data-oid="jas.rm2" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" data-oid="-qr:b7y" />
            </div>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium" data-oid="ktl6icr">
        {t("topBar.layouts.default")}
      </span>
    </div>
  )
}

export function OptionsLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
      data-oid="fd2k:lc"
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700" data-oid="jvz6:bg">
        <div className="flex h-full w-[75%] flex-col" data-oid="9fn3rzq">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700" data-oid="mqh6omz">
            <div className="w-[30%] border-r-2 border-gray-700 p-1" data-oid="9.2nsxr">
              <div className="w-full" data-oid="7opvbyw">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="2:1zi9k">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="zhi_wr1" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="dx5d:u7" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="du.7.mo">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="jsq.a73" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="yjq6:ju" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="_suh5wr">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="m24v147" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="s_14jmf" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700" data-oid="mbih58r">
              <div
                className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700"
                data-oid="x1n1o4l"
              >
                <Play className="text-primary h-3 w-3" data-oid="jf5yyx0" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full" data-oid="17-u0e9">
            <div className="w-[20%] border-r-2 border-gray-700 p-1" data-oid="m01:19m">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="s2oox39" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="bwvk61k" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="h:7-0a:" />
            </div>
            <div className="relative w-[60%] border-r-2 px-2 py-1" data-oid="ihkftzu">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" data-oid="hs:f57c" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" data-oid="-7xxvn1" />
            </div>
            <div className="w-[20%] border-gray-700 p-1" data-oid="a:dk_-p">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" data-oid="sz4920n" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" data-oid="qhzf:nl" />
            </div>
          </div>
        </div>
        <div className="h-full w-[25%] border-l-2 border-gray-700 p-1" data-oid=".l8emg:">
          <div className="bg-primary/70 mb-2 h-1 w-full rounded-sm" data-oid="qlzi_2q" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="h:7r2xn" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="mrcbk:u" />
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="cywm114" />
          <div className="bg-primary/70 h-1 w-full rounded-sm" data-oid="xdh3z_-" />
        </div>
      </div>
      <span className="text-[10px] font-medium" data-oid="u1siavj">
        {t("topBar.layouts.options")}
      </span>
    </div>
  )
}

export function VerticalLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
      data-oid="bp3mh4e"
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700" data-oid=":kcl619">
        <div className="flex h-full w-[70%] flex-col" data-oid="fhrbtgl">
          <div className="flex h-[50%] w-full border-b-2 border-gray-700" data-oid="rcxa_o6">
            <div className="w-[65%] p-1" data-oid="mj4gotb">
              <div className="w-full" data-oid="r9xbpi0">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="pkgz_qb">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="r_cif3j" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="0o32h.h" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="td02qy3" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="1tm:pfw" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="kk3s3q_">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="hdmcbw9" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="n7gaile" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="u5kghjb" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="d92j.e3" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid=".gcalp:">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="1zgh.tc" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="vv1607k" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="t6j51qs" />
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="8_08r01" />
                </div>
              </div>
            </div>
            <div className="w-[35%] border-l-2 border-gray-700 p-1" data-oid=":cp:pdw">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="uy10-vo" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="z_ef8tb" />
              <div className="bg-primary/70 h-1 w-full rounded-sm" data-oid="f58k3y-" />
            </div>
          </div>
          <div className="flex h-[50%] w-full" data-oid="1xltedt">
            <div className="w-[25%] border-r-2 border-gray-700 p-1" data-oid="q4:lq5n">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="u61t8zu" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="fzccwku" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="kromita" />
            </div>
            <div className="relative w-[50%] border-r-2 px-2 py-1" data-oid="f_3kwaj">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" data-oid="ico5cnj" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" data-oid="7byl2ix" />
            </div>
            <div className="w-[25%] border-gray-700 p-1" data-oid="h.lyjqg">
              <div className="bg-primary/70 h-0.5 w-full rounded-sm" data-oid="j_zur:c" />
              <div className="bg-primary/70 mt-6 h-1 w-full rounded-sm" data-oid="jx_rnhn" />
            </div>
          </div>
        </div>
        <div className="flex w-[30%] items-center justify-center border-l-2 border-gray-700" data-oid="nkkhq-o">
          <div
            className="bg-muted flex h-[95%] w-[85%] items-center justify-center border-2 border-gray-700"
            data-oid="8:o9i2m"
          >
            <Play className="text-primary h-4 w-4" data-oid="d1ul8z6" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-medium" data-oid="4:bsyr6">
        {t("topBar.layouts.vertical")}
      </span>
    </div>
  )
}

export function ChatLayout({ isActive, onClick }: LayoutProps) {
  const { t } = useTranslation()
  return (
    <div
      className={`flex cursor-pointer flex-col items-center ${isActive ? "bg-muted/40" : "hover:bg-muted/40"} p-2 pb-1`}
      onClick={onClick}
      data-oid="4kdvpb_"
    >
      <div className=" mb-1 flex h-24 w-40 flex-row border-2 border-gray-700" data-oid="dj7_wfz">
        <div className="flex h-full w-[75%] flex-col" data-oid="elpwcwz">
          <div className="flex h-[60%] w-full border-b-2 border-gray-700" data-oid="uu76g0p">
            <div className="w-[30%] border-r-2 border-gray-700 p-1" data-oid="ns5qmex">
              <div className="w-full" data-oid="opndh05">
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="kr-d-hw">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="d7mnmkn" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="jj2d1z3" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="rca8fgi">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid=".ar2hk:" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="cevip::" />
                </div>
                <div className="m-0 mb-1 flex flex-2 flex-row items-center gap-1 p-0" data-oid="twcz-x-">
                  <div className="bg-primary/70 h-2 w-[25%] rounded-xs" data-oid="yh48:5t" />
                  <div className="bg-primary/70 h-1 w-[75%] rounded-xs" data-oid="fjplgw7" />
                </div>
              </div>
            </div>
            <div className="flex w-[70%] items-center justify-center border-gray-700" data-oid="fyv8_r6">
              <div
                className="bg-muted flex h-[90%] w-[90%] items-center justify-center border-2 border-gray-700"
                data-oid="y08im2i"
              >
                <Play className="text-primary h-3 w-3" data-oid="_s-n-x-" />
              </div>
            </div>
          </div>
          <div className="flex h-[40%] w-full" data-oid="q6z0f4_">
            <div className="w-[30%] border-r-2 border-gray-700 p-1" data-oid="q4h9pv2">
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="3u13_9m" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="v-s:ww:" />
              <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="e6msze8" />
            </div>
            <div className="relative w-[70%] px-2 py-1" data-oid="4awj--i">
              <div className="bg-primary/70 mb-1 h-2 w-full rounded-sm" data-oid="w-ctx4r" />
              <div className="bg-primary/70 h-2 w-[75%] rounded-sm" data-oid="k04:4sl" />
            </div>
          </div>
        </div>
        <div className="h-full w-[25%] border-l-2 border-gray-700 p-1" data-oid="d:2ii4_">
          <div className="flex items-center justify-center mb-2" data-oid="8u.gq7f">
            <MessageCircle className="text-primary h-3 w-3" data-oid="a3qnese" />
          </div>
          <div className="bg-primary/70 mb-1 h-1 w-full rounded-sm" data-oid="920vft9" />
          <div className="bg-primary/70 mb-1 h-1 w-[80%] rounded-sm" data-oid="o3aacg2" />
          <div className="bg-primary/70 mb-1 h-1 w-[60%] rounded-sm" data-oid="qmn9nhs" />
          <div className="bg-primary/70 mb-1 h-1 w-[90%] rounded-sm" data-oid="f-y32o3" />
          <div className="bg-primary/70 h-1 w-[70%] rounded-sm" data-oid="zbv70s_" />
        </div>
      </div>
      <span className="text-[10px] font-medium" data-oid="xo07_d0">
        {t("topBar.layouts.chat")}
      </span>
    </div>
  )
}
