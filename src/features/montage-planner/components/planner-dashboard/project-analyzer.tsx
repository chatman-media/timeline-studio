/**
 * Project analysis viewer component
 * Displays results of content analysis including quality metrics and detected moments
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { Eye, Film, MessageSquare, Music, Star, Zap } from "lucide-react"

import { useContentAnalysis } from "../../hooks/use-content-analysis"
import { MomentCategory } from "../../types"

export function ProjectAnalyzer() {
  const { contentStats, averageVideoQuality, averageAudioQuality, topMoments, momentCategoryCounts, fragments } =
    useContentAnalysis()

  const getCategoryIcon = (category: MomentCategory) => {
    const icons = {
      [MomentCategory.Highlight]: <Star className="h-4 w-4" data-oid="1xp5-0r" />,
      [MomentCategory.Action]: <Zap className="h-4 w-4" data-oid=":auvcv4" />,
      [MomentCategory.Drama]: <MessageSquare className="h-4 w-4" data-oid="883-zfo" />,
      [MomentCategory.Comedy]: <Film className="h-4 w-4" data-oid="fntsa27" />,
      [MomentCategory.Opening]: <Eye className="h-4 w-4" data-oid="ct-wfob" />,
      [MomentCategory.Closing]: <Film className="h-4 w-4" data-oid="_h-4w3j" />,
      [MomentCategory.BRoll]: <Film className="h-4 w-4" data-oid="vm5lr:." />,
      [MomentCategory.Transition]: <Film className="h-4 w-4" data-oid="k:kkxki" />,
    }
    return icons[category] || <Film className="h-4 w-4" data-oid="4n12exi" />
  }

  const getCategoryColor = (category: MomentCategory) => {
    const colors = {
      [MomentCategory.Highlight]: "bg-yellow-500",
      [MomentCategory.Action]: "bg-red-500",
      [MomentCategory.Drama]: "bg-purple-500",
      [MomentCategory.Comedy]: "bg-green-500",
      [MomentCategory.Opening]: "bg-blue-500",
      [MomentCategory.Closing]: "bg-indigo-500",
      [MomentCategory.BRoll]: "bg-gray-500",
      [MomentCategory.Transition]: "bg-cyan-500",
    }
    return colors[category] || "bg-gray-500"
  }

  return (
    <div className="space-y-4" data-oid="nt2ft4p">
      <h3 className="text-lg font-semibold" data-oid="rix:6g2">
        Content Analysis Results
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-oid="zqu729f">
        {/* Video Quality */}
        <Card data-oid="7acn6xb">
          <CardHeader className="pb-3" data-oid="9:h4klv">
            <CardTitle className="text-sm font-medium" data-oid="zz13zp4">
              Video Quality
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="p5asd8q">
            <div className="space-y-2" data-oid="zjiid82">
              <div className="flex items-center justify-between" data-oid="fpsnq98">
                <Film className="h-4 w-4 text-muted-foreground" data-oid="om1kknr" />
                <span className="text-2xl font-bold" data-oid="hs9hu45">
                  {averageVideoQuality.toFixed(0)}%
                </span>
              </div>
              <Progress value={averageVideoQuality} className="h-2" data-oid="_ojf5sa" />
            </div>
          </CardContent>
        </Card>

        {/* Audio Quality */}
        <Card data-oid="a.1qbqz">
          <CardHeader className="pb-3" data-oid="7tp2oau">
            <CardTitle className="text-sm font-medium" data-oid="ie0twq2">
              Audio Quality
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="44m6yim">
            <div className="space-y-2" data-oid="kqh.c0c">
              <div className="flex items-center justify-between" data-oid="bx34id_">
                <Music className="h-4 w-4 text-muted-foreground" data-oid="kk4fr4:" />
                <span className="text-2xl font-bold" data-oid="1v4f53z">
                  {averageAudioQuality.toFixed(0)}%
                </span>
              </div>
              <Progress value={averageAudioQuality} className="h-2" data-oid="rfcfkv2" />
            </div>
          </CardContent>
        </Card>

        {/* Action Level */}
        <Card data-oid="h2c:roa">
          <CardHeader className="pb-3" data-oid="1schgu.">
            <CardTitle className="text-sm font-medium" data-oid=".s9r1ci">
              Action Level
            </CardTitle>
          </CardHeader>
          <CardContent data-oid=":pfggnc">
            <div className="space-y-2" data-oid="x_7ns7q">
              <div className="flex items-center justify-between" data-oid="2bbyuzz">
                <Zap className="h-4 w-4 text-muted-foreground" data-oid="75rnfa8" />
                <span className="text-2xl font-bold" data-oid="m0lqzm1">
                  {contentStats.averageActionLevel.toFixed(0)}%
                </span>
              </div>
              <Progress value={contentStats.averageActionLevel} className="h-2" data-oid="1icw1bw" />
            </div>
          </CardContent>
        </Card>

        {/* Speech Presence */}
        <Card data-oid="xv4h5-1">
          <CardHeader className="pb-3" data-oid="fnu.6cs">
            <CardTitle className="text-sm font-medium" data-oid="nqwt-q4">
              Speech Presence
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="pc81h_c">
            <div className="space-y-2" data-oid="pibmbo8">
              <div className="flex items-center justify-between" data-oid="j1fkhtk">
                <MessageSquare className="h-4 w-4 text-muted-foreground" data-oid="y_xu32m" />
                <span className="text-2xl font-bold" data-oid="gr:79ti">
                  {contentStats.speechPresence.toFixed(0)}%
                </span>
              </div>
              <Progress value={contentStats.speechPresence} className="h-2" data-oid="0p2qtdb" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="moments" className="w-full" data-oid="-zuppsb">
        <TabsList className="grid w-full grid-cols-3" data-oid="368z4em">
          <TabsTrigger value="moments" data-oid="cskvm-7">
            Top Moments
          </TabsTrigger>
          <TabsTrigger value="categories" data-oid="aknrwh-">
            Categories
          </TabsTrigger>
          <TabsTrigger value="fragments" data-oid=".wlwks_">
            All Fragments
          </TabsTrigger>
        </TabsList>

        {/* Top Moments */}
        <TabsContent value="moments" data-oid="69k38b.">
          <Card data-oid="vprsq1y">
            <CardHeader data-oid="wvym-7_">
              <CardTitle data-oid="f0asilv">Top Moments</CardTitle>
              <CardDescription data-oid="4mlk16f">Highest scoring moments detected in your content</CardDescription>
            </CardHeader>
            <CardContent data-oid="--75217">
              <ScrollArea className="h-[300px]" data-oid="9e_hojj">
                <div className="space-y-2" data-oid="ie6kwh5">
                  {topMoments.map((moment, index) => (
                    <div
                      key={`moment-${index}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                      data-oid="kcon4p1"
                    >
                      <div className="flex items-center gap-3" data-oid="gqp14q-">
                        <div
                          className={`h-2 w-2 rounded-full ${getCategoryColor(moment.category)}`}
                          data-oid="du26i68"
                        />

                        <div data-oid="l9vst_k">
                          <p className="font-medium" data-oid=".yhtgyk">
                            {Number(moment.timestamp || 0).toFixed(1)}s -{" "}
                            {(Number(moment.timestamp || 0) + Number(moment.duration || 0)).toFixed(1)}s
                          </p>
                          <p className="text-sm text-muted-foreground" data-oid="dk596v_">
                            {moment.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" data-oid="tk:28y8">
                        <Badge variant="secondary" data-oid="zolhe:z">
                          {moment.totalScore.toFixed(0)}
                        </Badge>
                        {getCategoryIcon(moment.category)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" data-oid=":sadh87">
          <Card data-oid="jkfeqr-">
            <CardHeader data-oid="987:0cy">
              <CardTitle data-oid="1xbf9xo">Moment Categories</CardTitle>
              <CardDescription data-oid="gkv666.">Distribution of detected moment types</CardDescription>
            </CardHeader>
            <CardContent data-oid="yr_2zj:">
              <div className="space-y-3" data-oid="-utbu9_">
                {Object.entries(momentCategoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between" data-oid="8ltmkoi">
                    <div className="flex items-center gap-2" data-oid="d9xd-m2">
                      {getCategoryIcon(category as MomentCategory)}
                      <span className="capitalize" data-oid="_2z37m6">
                        {category.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" data-oid="fo.898o">
                      <Progress
                        value={(count / contentStats.totalMoments) * 100}
                        className="w-[100px] h-2"
                        data-oid="8x:1vdj"
                      />

                      <span className="text-sm font-medium w-8 text-right" data-oid="6hvowt4">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Fragments */}
        <TabsContent value="fragments" data-oid="t:v:_4b">
          <Card data-oid="wxoj4rc">
            <CardHeader data-oid="zq6575z">
              <CardTitle data-oid="4ggluep">All Fragments</CardTitle>
              <CardDescription data-oid="l0b4nza">Complete list of detected video fragments</CardDescription>
            </CardHeader>
            <CardContent data-oid="2kqfov-">
              <ScrollArea className="h-[300px]" data-oid="hfv-p7x">
                <div className="space-y-2" data-oid="p-j0xvk">
                  {fragments.map((fragment: any) => (
                    <div
                      key={fragment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                      data-oid="3ulhvzl"
                    >
                      <div className="flex-1" data-oid="1ojum8n">
                        <p className="font-medium" data-oid="d:hra5g">
                          {fragment.videoId}
                        </p>
                        <p className="text-sm text-muted-foreground" data-oid="hmve5g8">
                          {fragment.startTime.toFixed(1)}s - {fragment.endTime.toFixed(1)}s
                          {fragment.description && ` • ${fragment.description}`}
                        </p>
                        <div className="mt-1 flex gap-1" data-oid=".-yoen9">
                          {fragment.tags.slice(0, 3).map((tag: any) => (
                            <Badge key={tag} variant="outline" className="text-xs" data-oid=":.p_ip4">
                              {tag}
                            </Badge>
                          ))}
                          {fragment.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs" data-oid="0d6c4r9">
                              +{fragment.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" data-oid="wfa1.5z">
                        <Badge data-oid="kuv2d3n">{fragment.score.totalScore.toFixed(0)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
