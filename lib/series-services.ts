// @ts-nocheck
/* eslint-disable */

import { api } from "./api"

export interface Series {
  id: number
  title: string
  slug: string
  description: string
  release_date: string
  status: string
  created_at: string
  updated_at: string
  seasons_count: number
  episodes_count: number
}

export interface Season {
  id: number
  series_id: number
  season_number: number
  title: string
  slug: string
  release_date: string
  status: string
  created_at: string
  updated_at: string
  series?: Series
}

export interface Episode {
  id: number
  series_id: number
  season_id: number
  episode_number: number
  title: string
  slug: string
  synopsis: string
  runtime_minutes: number | null
  release_date: string | null
  status: string
  content_id: number | null
  created_at: string
  updated_at: string
  season?: Season
  series?: Series
  content?: any
  // Episode content fields (similar to movie content)
  director_name?: string
  genre_id?: number
  image?: string
  profile_pic?: string
  video1?: string | object
  duration?: string
  publish?: string
  schedule_date?: string
  schedule_time?: string
  description?: string
}

export const seriesService = {
  getSeries: async (
    page = 1,
  ): Promise<{
    data: Series[]
    total: number
    per_page: number
    current_page: number
  }> => {
    const response = await api.get(`/api/series?page=${page}`)
    return response.data.data
  },

  createSeries: async (data: {
    title: string
    description: string
    release_date: string
    status: string
  }): Promise<Series> => {
    const response = await api.post("/api/series", data)
    return response.data
  },

  updateSeries: async (
    id: number,
    data: {
      title: string
      description: string
      release_date: string
      status: string
    },
  ): Promise<Series> => {
    const response = await api.post(`/api/series/${id}?_method=PUT`, data)
    return response.data
  },

  deleteSeries: async (id: number): Promise<void> => {
    await api.delete(`/api/series/${id}`)
  },
}

export const seasonService = {
  getSeasons: async (
    page = 1,
  ): Promise<{
    data: Season[]
    total: number
    per_page: number
    current_page: number
  }> => {
    const response = await api.get(`/api/seasons?page=${page}`)
    return response.data.data
  },

  getSeasonsBySeries: async (seriesId: number): Promise<Season[]> => {
    const response = await api.get(`/api/seasons?series_id=${seriesId}`)
    return response.data.data?.data || []
  },

  createSeason: async (data: {
    series_id: number
    season_number: number
    title: string
    release_date: string
    status: string
  }): Promise<Season> => {
    const response = await api.post("/api/seasons", data)
    return response.data
  },

  updateSeason: async (
    id: number,
    data: {
      series_id: number
      season_number: number
      title: string
      release_date: string
      status: string
    },
  ): Promise<Season> => {
    const response = await api.post(`/api/seasons/${id}?_method=PUT`, data)
    return response.data
  },

  deleteSeason: async (id: number): Promise<void> => {
    await api.delete(`/api/seasons/${id}`)
  },
}

export const episodeService = {
  getEpisodes: async (
    page = 1,
  ): Promise<{
    data: Episode[]
    total: number
    per_page: number
    current_page: number
  }> => {
    const response = await api.get(`/api/episodes?page=${page}`)
    return response.data
  },

  getEpisodesBySeason: async (seasonId: number): Promise<Episode[]> => {
    const response = await api.get(`/api/episodes?season_id=${seasonId}`)
    return response.data.data || []
  },

  createEpisode: async (
    data: FormData,
    onUploadProgress?: (progressEvent: ProgressEvent) => void,
  ): Promise<Episode> => {
    console.log("🚀 Creating episode with FormData")

    // Log FormData contents for debugging
    console.log("📤 FormData contents being sent:")
    for (const [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }

    const response = await api.post("/api/episodes", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    })

    console.log("✅ Episode created successfully:", response.data)
    return response.data
  },

  updateEpisode: async (id: number, data: FormData): Promise<Episode> => {
    console.log(`🔄 Updating episode ${id} with FormData`)

    // Log FormData contents for debugging
    console.log("📤 FormData contents being sent:")
    for (const [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }

    const response = await api.post(`/api/episodes/${id}?_method=PUT`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    console.log("✅ Episode updated successfully:", response.data)
    return response.data
  },

  deleteEpisode: async (id: number): Promise<void> => {
    await api.delete(`/api/episodes/${id}`)
  },
}
