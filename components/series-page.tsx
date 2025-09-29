"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  seriesService,
  seasonService,
  episodeService,
  type Series,
  type Season,
  type Episode,
} from "@/lib/series-services"
import { genreService } from "@/lib/services"
import { Edit, Trash2, Plus, Play, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Pagination } from "@/components/pagination"
import { SeriesForm } from "@/components/series-form"
import { SeasonForm } from "@/components/season-form"
import { EpisodeForm } from "@/components/episode-form"

export default function SeriesPage() {
  const [activeTab, setActiveTab] = useState("series")
  const [currentPage, setCurrentPage] = useState(1)

  // Series states
  const [isSeriesFormOpen, setIsSeriesFormOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)

  // Season states
  const [isSeasonFormOpen, setIsSeasonFormOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)

  // Episode states
  const [isEpisodeFormOpen, setIsEpisodeFormOpen] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [selectedSeriesForSeasons, setSelectedSeriesForSeasons] = useState<string>("")

  const queryClient = useQueryClient()

  // Queries
  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ["series", currentPage],
    queryFn: () => seriesService.getSeries(currentPage),
  })

  const { data: seasonsData, isLoading: seasonsLoading } = useQuery({
    queryKey: ["seasons", currentPage],
    queryFn: () => seasonService.getSeasons(currentPage),
  })

  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", currentPage],
    queryFn: () => episodeService.getEpisodes(currentPage),
  })

  const { data: genresData } = useQuery({
    queryKey: ["genres-all"],
    queryFn: () => genreService.getGenres(1),
  })

  // Get all series for dropdowns
  const { data: allSeriesData } = useQuery({
    queryKey: ["all-series"],
    queryFn: () => seriesService.getSeries(1),
  })

  // Get all seasons for dropdowns
  const { data: allSeasonsData } = useQuery({
    queryKey: ["all-seasons"],
    queryFn: () => seasonService.getSeasons(1),
  })

  // Series mutations
  const createSeriesMutation = useMutation({
    mutationFn: seriesService.createSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] })
      queryClient.invalidateQueries({ queryKey: ["all-series"] })
      setIsSeriesFormOpen(false)
      toast.success("Series created successfully")
    },
    onError: () => {
      toast.error("Failed to create series")
    },
  })

  const updateSeriesMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => seriesService.updateSeries(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] })
      queryClient.invalidateQueries({ queryKey: ["all-series"] })
      setIsSeriesFormOpen(false)
      setEditingSeries(null)
      toast.success("Series updated successfully")
    },
    onError: () => {
      toast.error("Failed to update series")
    },
  })

  const deleteSeriesMutation = useMutation({
    mutationFn: seriesService.deleteSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] })
      queryClient.invalidateQueries({ queryKey: ["all-series"] })
      toast.success("Series deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete series")
    },
  })

  // Season mutations
  const createSeasonMutation = useMutation({
    mutationFn: seasonService.createSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      queryClient.invalidateQueries({ queryKey: ["all-seasons"] })
      setIsSeasonFormOpen(false)
      toast.success("Season created successfully")
    },
    onError: () => {
      toast.error("Failed to create season")
    },
  })

  const updateSeasonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => seasonService.updateSeason(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      queryClient.invalidateQueries({ queryKey: ["all-seasons"] })
      setIsSeasonFormOpen(false)
      setEditingSeason(null)
      toast.success("Season updated successfully")
    },
    onError: () => {
      toast.error("Failed to update season")
    },
  })

  const deleteSeasonMutation = useMutation({
    mutationFn: seasonService.deleteSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] })
      queryClient.invalidateQueries({ queryKey: ["all-seasons"] })
      toast.success("Season deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete season")
    },
  })

  // Episode mutations
  const createEpisodeMutation = useMutation({
    mutationFn: episodeService.createEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] })
      setIsEpisodeFormOpen(false)
      toast.success("Episode created successfully")
    },
    onError: () => {
      toast.error("Failed to create episode")
    },
  })

  const updateEpisodeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => episodeService.updateEpisode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] })
      setIsEpisodeFormOpen(false)
      setEditingEpisode(null)
      toast.success("Episode updated successfully")
    },
    onError: () => {
      toast.error("Failed to update episode")
    },
  })

  const deleteEpisodeMutation = useMutation({
    mutationFn: episodeService.deleteEpisode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] })
      toast.success("Episode deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete episode")
    },
  })

  // Handlers
  const handleSeriesSubmit = (data: any) => {
    if (editingSeries) {
      updateSeriesMutation.mutate({ id: editingSeries.id, data })
    } else {
      createSeriesMutation.mutate(data)
    }
  }

  const handleSeasonSubmit = (data: any) => {
    if (editingSeason) {
      updateSeasonMutation.mutate({ id: editingSeason.id, data })
    } else {
      createSeasonMutation.mutate(data)
    }
  }

  const handleEpisodeSubmit = (data: FormData) => {
    if (editingEpisode) {
      updateEpisodeMutation.mutate({ id: editingEpisode.id, data })
    } else {
      createEpisodeMutation.mutate(data)
    }
  }

  const handleSeriesEdit = (series: Series) => {
    setEditingSeries(series)
    setIsSeriesFormOpen(true)
  }

  const handleSeasonEdit = (season: Season) => {
    setEditingSeason(season)
    setIsSeasonFormOpen(true)
  }

  const handleEpisodeEdit = (episode: Episode) => {
    setEditingEpisode(episode)
    setIsEpisodeFormOpen(true)
  }

  const handleSeriesChangeForSeasons = (seriesId: string) => {
    setSelectedSeriesForSeasons(seriesId)
    // Refresh seasons when series changes
    queryClient.invalidateQueries({ queryKey: ["all-seasons"] })
  }

  // Data processing
  const seriesList = Array.isArray(seriesData?.data) ? seriesData.data : []
  const seasonsList = Array.isArray(seasonsData?.data) ? seasonsData.data : []
  const episodesList = Array.isArray(episodesData?.data) ? episodesData.data : []
  const genresList = Array.isArray(genresData?.data) ? genresData.data : []
  const allSeriesList = Array.isArray(allSeriesData?.data) ? allSeriesData.data : []
  const allSeasonsList = Array.isArray(allSeasonsData?.data) ? allSeasonsData.data : []

  const getTotalPages = (data: any) => {
    if (data?.total && data?.per_page) {
      return Math.ceil(data.total / data.per_page)
    }
    return 1
  }

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between bg-[#111]">
          <div>
            <h1 className="text-3xl font-bold text-white">TV Series Management</h1>
            <p className="text-gray-400">Dashboard › Series</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#272727]">
            <TabsTrigger
              value="series"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Series
            </TabsTrigger>
            <TabsTrigger
              value="seasons"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Seasons
            </TabsTrigger>
            <TabsTrigger
              value="episodes"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Episodes
            </TabsTrigger>
          </TabsList>

          {/* Series Tab */}
          <TabsContent value="series" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingSeries(null)
                  setIsSeriesFormOpen(true)
                }}
                className="bg-white text-black hover:bg-gray-100 rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Series
              </Button>
            </div>

            <Card style={{ backgroundColor: "#272727" }} className="border-none rounded-lg">
              <CardContent className="p-0 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-[#272727]">
                      <TableHead className="text-gray-300 font-medium">Series</TableHead>
                      <TableHead className="text-gray-300 font-medium">Release Date</TableHead>
                      <TableHead className="text-gray-300 font-medium">Status</TableHead>
                      <TableHead className="text-gray-300 font-medium">Seasons</TableHead>
                      <TableHead className="text-gray-300 font-medium">Episodes</TableHead>
                      <TableHead className="text-gray-300 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seriesList.map((series: Series) => (
                      <TableRow
                        key={series.id}
                        className="border-[BFBFBF] hover:bg-gray-600"
                        style={{ backgroundColor: "#272727" }}
                      >
                        <TableCell className="py-4">
                          <div>
                            <h3 className="text-white font-medium">{series.title}</h3>
                            <p className="text-gray-400 text-sm truncate max-w-xs">{series.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(series.release_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              series.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
                            }
                          >
                            {series.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {series.seasons_count}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            {series.episodes_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSeriesEdit(series)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSeriesMutation.mutate(series.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {seriesData && (
                  <Pagination
                    currentPage={seriesData.current_page || currentPage}
                    totalPages={getTotalPages(seriesData)}
                    onPageChange={setCurrentPage}
                    totalItems={seriesData.total || 0}
                    itemsPerPage={seriesData.per_page || 10}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingSeason(null)
                  setIsSeasonFormOpen(true)
                }}
                className="bg-white text-black hover:bg-gray-100 rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Season
              </Button>
            </div>

            <Card style={{ backgroundColor: "#272727" }} className="border-none rounded-lg">
              <CardContent className="p-0 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-[#272727]">
                      <TableHead className="text-gray-300 font-medium">Season</TableHead>
                      <TableHead className="text-gray-300 font-medium">Series</TableHead>
                      <TableHead className="text-gray-300 font-medium">Season Number</TableHead>
                      <TableHead className="text-gray-300 font-medium">Release Date</TableHead>
                      <TableHead className="text-gray-300 font-medium">Status</TableHead>
                      <TableHead className="text-gray-300 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasonsList.map((season: Season) => (
                      <TableRow
                        key={season.id}
                        className="border-[BFBFBF] hover:bg-gray-600"
                        style={{ backgroundColor: "#272727" }}
                      >
                        <TableCell className="py-4">
                          <div>
                            <h3 className="text-white font-medium">{season.title}</h3>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {season.series?.title || `Series ${season.series_id}`}
                        </TableCell>
                        <TableCell className="text-gray-300">Season {season.season_number}</TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(season.release_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              season.status === "active" ? "bg-green-600 text-white" : "bg-gray-600 text-white"
                            }
                          >
                            {season.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSeasonEdit(season)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteSeasonMutation.mutate(season.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {seasonsData && (
                  <Pagination
                    currentPage={seasonsData.current_page || currentPage}
                    totalPages={getTotalPages(seasonsData)}
                    onPageChange={setCurrentPage}
                    totalItems={seasonsData.total || 0}
                    itemsPerPage={seasonsData.per_page || 10}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingEpisode(null)
                  setIsEpisodeFormOpen(true)
                }}
                className="bg-white text-black hover:bg-gray-100 rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Episode
              </Button>
            </div>

            <Card style={{ backgroundColor: "#272727" }} className="border-none rounded-lg">
              <CardContent className="p-0 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none bg-[#272727]">
                      <TableHead className="text-gray-300 font-medium">Episode</TableHead>
                      <TableHead className="text-gray-300 font-medium">Series</TableHead>
                      <TableHead className="text-gray-300 font-medium">Season</TableHead>
                      <TableHead className="text-gray-300 font-medium">Episode #</TableHead>
                      <TableHead className="text-gray-300 font-medium">Runtime</TableHead>
                      <TableHead className="text-gray-300 font-medium">Status</TableHead>
                      <TableHead className="text-gray-300 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episodesList.map((episode: Episode) => (
                      <TableRow
                        key={episode.id}
                        className="border-[BFBFBF] hover:bg-gray-600"
                        style={{ backgroundColor: "#272727" }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            {episode.image && (
                              <div className="relative">
                                <Image
                                  src={episode.image || "/placeholder.svg?height=60&width=80"}
                                  alt={episode.title}
                                  width={80}
                                  height={60}
                                  className="rounded object-cover"
                                />
                                {episode.video1 && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                    <Play className="h-6 w-6 text-white" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div>
                              <h3 className="text-white font-medium">{episode.title}</h3>
                              <p className="text-gray-400 text-sm truncate max-w-xs">{episode.synopsis}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {episode.series?.title || `Series ${episode.series_id}`}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {episode.season?.title || `Season ${episode.season_id}`}
                        </TableCell>
                        <TableCell className="text-gray-300">Episode {episode.episode_number}</TableCell>
                        <TableCell className="text-gray-300">
                          {episode.runtime_minutes ? `${episode.runtime_minutes} min` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              episode.status === "active"
                                ? "bg-green-600 text-white"
                                : episode.status === "draft"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-gray-600 text-white"
                            }
                          >
                            {episode.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEpisodeEdit(episode)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteEpisodeMutation.mutate(episode.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {episodesData && (
                  <Pagination
                    currentPage={episodesData.meta?.current_page || currentPage}
                    totalPages={getTotalPages(episodesData.meta)}
                    onPageChange={setCurrentPage}
                    totalItems={episodesData.meta?.total || 0}
                    itemsPerPage={episodesData.meta?.per_page || 10}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Forms */}
        <SeriesForm
          isOpen={isSeriesFormOpen}
          onClose={() => {
            setIsSeriesFormOpen(false)
            setEditingSeries(null)
          }}
          onSubmit={handleSeriesSubmit}
          editingSeries={editingSeries}
          isLoading={createSeriesMutation.isPending || updateSeriesMutation.isPending}
        />

        <SeasonForm
          isOpen={isSeasonFormOpen}
          onClose={() => {
            setIsSeasonFormOpen(false)
            setEditingSeason(null)
          }}
          onSubmit={handleSeasonSubmit}
          editingSeason={editingSeason}
          seriesList={allSeriesList}
          isLoading={createSeasonMutation.isPending || updateSeasonMutation.isPending}
        />

        <EpisodeForm
          isOpen={isEpisodeFormOpen}
          onClose={() => {
            setIsEpisodeFormOpen(false)
            setEditingEpisode(null)
          }}
          onSubmit={handleEpisodeSubmit}
          editingEpisode={editingEpisode}
          seriesList={allSeriesList}
          seasonsList={allSeasonsList}
          genresList={genresList}
          isLoading={createEpisodeMutation.isPending || updateEpisodeMutation.isPending}
          onSeriesChange={handleSeriesChangeForSeasons}
        />
      </div>
    </div>
  )
}
