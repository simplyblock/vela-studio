import { useEffect, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'

import { useParams } from 'common'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { BASE_PATH } from 'lib/constants'
import GeographyData from './MapData.json'

// [Joshen] Foresee that we'll skip this view for initial launch

interface MapViewProps {
  onSelectDeployNewReplica: () => void
  onSelectRestartReplica: (database: Database) => void
  onSelectDropReplica: (database: Database) => void
}

const MapView = ({
}: MapViewProps) => {
  const { slug, ref } = useParams()

  const [mount, setMount] = useState(false)
  const [zoom, setZoom] = useState<number>(1.5)
  const [center, setCenter] = useState<[number, number]>([14, 7])
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    region: { key: string; country?: string; name?: string; region?: string }
  }>()
  // FIXME: need permission implemented 
  const { can: canManageReplicas } = {can:true}

  const { data } = useReadReplicasQuery({ orgSlug: slug, projectRef: ref })
  const databases = data ?? []

  useEffect(() => {
    setTimeout(() => setMount(true), 100)
  }, [])

  return (
    <div className="bg-studio h-[500px] relative">
      <ComposableMap projectionConfig={{ scale: 155 }} className="w-full h-full">
        <ZoomableGroup
          className={mount ? 'transition-all duration-300' : ''}
          center={center}
          zoom={zoom}
          minZoom={1.5}
          maxZoom={2.0}
          filterZoomEvent={({ constructor: { name } }) =>
            !['MouseEvent', 'WheelEvent'].includes(name)
          }
        >
          <Geographies geography={GeographyData}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  strokeWidth={0.3}
                  pointerEvents="none"
                  className="fill-gray-800 stroke-gray-900 dark:fill-gray-300 dark:stroke-gray-200"
                />
              ))
            }
          </Geographies>

          {tooltip !== undefined && zoom === 1.5 && (
            <Marker coordinates={[tooltip.x - 47, tooltip.y - 5]}>
              <foreignObject width={220} height={66.25}>
                <div className="bg-studio/50 rounded border">
                  <div className="px-3 py-2 flex flex-col">
                    <div className="flex items-center gap-x-2">
                      <img
                        alt="region icon"
                        className="w-4 rounded-sm"
                        src={`${BASE_PATH}/img/regions/${tooltip.region.region}.svg`}
                      />
                      <p className="text-[10px]">{tooltip.region.country}</p>
                    </div>
                    <p
                      className={`text-[10px] ${
                        tooltip.region.name === undefined ? 'text-foreground-light' : ''
                      }`}
                    >
                      {tooltip.region.name ?? 'No databases deployed'}
                    </p>
                  </div>
                </div>
              </foreignObject>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

export default MapView
