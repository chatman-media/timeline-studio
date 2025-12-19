/**
 * Suggestions component for Smart Montage Planner
 * Displays AI-generated recommendations for improving the montage plan
 */

import { AlertTriangle, CheckCircle, Info, Lightbulb } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useMontagePlanner } from "../../hooks/use-montage-planner"
import { usePlanGenerator } from "../../hooks/use-plan-generator"

export function Suggestions() {
  const { improvementSuggestions, fragmentUsage } = usePlanGenerator()
  const { optimizePlan, isOptimizing } = useMontagePlanner()

  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.toLowerCase().includes("quality")) {
      return <AlertTriangle className="h-4 w-4" data-oid="3z9g4ou" />
    }
    if (suggestion.toLowerCase().includes("add") || suggestion.toLowerCase().includes("more")) {
      return <Info className="h-4 w-4" data-oid="jri3z57" />
    }
    return <Lightbulb className="h-4 w-4" data-oid="gtbh4nu" />
  }

  const getSuggestionVariant = (suggestion: string): "default" | "destructive" => {
    if (suggestion.toLowerCase().includes("quality") || suggestion.toLowerCase().includes("replace")) {
      return "destructive"
    }
    return "default"
  }

  return (
    <div className="space-y-4" data-oid="2bq1vqn">
      <div className="flex items-center justify-between" data-oid="nmrck8x">
        <h3 className="text-lg font-semibold" data-oid="_6ajc--">
          Suggestions & Insights
        </h3>
        <Button size="sm" onClick={optimizePlan} disabled={isOptimizing} data-oid="r:7df38">
          Apply Optimizations
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2" data-oid=":rser4i">
        {/* Improvement Suggestions */}
        <Card data-oid="69r4c6l">
          <CardHeader data-oid="qzxljen">
            <CardTitle className="flex items-center gap-2" data-oid="ls6j9jm">
              <Lightbulb className="h-5 w-5" data-oid="abaw0-z" />
              Improvement Suggestions
            </CardTitle>
            <CardDescription data-oid="-5joqlf">Recommendations to enhance your montage</CardDescription>
          </CardHeader>
          <CardContent data-oid="deq2nl0">
            {improvementSuggestions.length > 0 ? (
              <div className="space-y-2" data-oid="qafh1ee">
                {improvementSuggestions.map((suggestion, index) => (
                  <Alert key={index} variant={getSuggestionVariant(suggestion)} data-oid=".7d.pds">
                    {getSuggestionIcon(suggestion)}
                    <AlertDescription data-oid="n5mx-uv">{suggestion}</AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <Alert data-oid="cj.eh04">
                <CheckCircle className="h-4 w-4" data-oid="3_kvmns" />
                <AlertDescription data-oid="vo8p8hl">
                  Your montage plan looks great! No major improvements needed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Fragment Usage Stats */}
        <Card data-oid="6igc:7l">
          <CardHeader data-oid="zz.dfn2">
            <CardTitle data-oid="n5n.8d3">Fragment Usage</CardTitle>
            <CardDescription data-oid="axy7e_w">How your content is being utilized</CardDescription>
          </CardHeader>
          <CardContent data-oid="v3s4rlt">
            <div className="space-y-3" data-oid="jcd1tkc">
              <div className="flex justify-between items-center" data-oid="4otorx2">
                <span className="text-sm" data-oid="xiyz55u">
                  Total Fragments
                </span>
                <Badge variant="outline" data-oid="-id8tsc">
                  {fragmentUsage.totalFragments}
                </Badge>
              </div>
              <div className="flex justify-between items-center" data-oid="jeb91ny">
                <span className="text-sm" data-oid="8_2t9u3">
                  Used Fragments
                </span>
                <Badge variant="default" data-oid="fawiura">
                  {fragmentUsage.usedFragments}
                </Badge>
              </div>
              <div className="flex justify-between items-center" data-oid="8r11pk6">
                <span className="text-sm" data-oid="2-v0zeo">
                  Unused Fragments
                </span>
                <Badge variant="secondary" data-oid=".d.tn63">
                  {fragmentUsage.unusedFragments.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center" data-oid="-1zntmr">
                <span className="text-sm" data-oid="jmq.g78">
                  Multi-use Fragments
                </span>
                <Badge variant="outline" data-oid="ex52opn">
                  {fragmentUsage.multiUseFragments.length}
                </Badge>
              </div>

              {fragmentUsage.unusedFragments.length > 0 && (
                <div className="pt-2 border-t" data-oid="az4s1:v">
                  <p className="text-sm font-medium mb-2" data-oid="6ci9im4">
                    Top Unused Fragments
                  </p>
                  <div className="space-y-1" data-oid="fd8px23">
                    {fragmentUsage.unusedFragments.slice(0, 3).map((fragment: any) => (
                      <div key={fragment.id} className="text-xs text-muted-foreground" data-oid="fcw6n66">
                        • {fragment.videoId} ({fragment.startTime.toFixed(1)}s - Score:{" "}
                        {fragment.score.totalScore.toFixed(0)})
                      </div>
                    ))}
                    {fragmentUsage.unusedFragments.length > 3 && (
                      <p className="text-xs text-muted-foreground" data-oid="6_gm0yy">
                        ...and {fragmentUsage.unusedFragments.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Style-specific Tips */}
      <Card data-oid="eio78uh">
        <CardHeader data-oid="__58fj2">
          <CardTitle data-oid="ee4s-ig">Style Tips</CardTitle>
          <CardDescription data-oid="e1j21a4">Recommendations based on your selected montage style</CardDescription>
        </CardHeader>
        <CardContent data-oid="2h8afcv">
          <div className="space-y-2" data-oid="xzesj5b">
            <Alert data-oid="q:u_rot">
              <Info className="h-4 w-4" data-oid=":9:43hc" />
              <AlertDescription data-oid=".8dqo6f">
                <strong data-oid="0wwsg80">Tip:</strong> For dynamic action montages, consider adding more quick cuts
                during high-energy moments to maintain viewer engagement.
              </AlertDescription>
            </Alert>
            <Alert data-oid="j5gtkl_">
              <Info className="h-4 w-4" data-oid="_hv0tc9" />
              <AlertDescription data-oid="qc8b0ai">
                <strong data-oid="8th-..s">Tip:</strong> Sync your cuts with music beats for a more professional and
                engaging result.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
