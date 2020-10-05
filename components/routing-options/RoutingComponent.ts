import mapboxgl, { IControl, Map, MapMouseEvent, Marker } from 'mapbox-gl';
import { RoutingApi } from '../../apis/routing-api/RoutingApi';
import ComponentHtml from '*.html';
import * as turf from '@turf/turf';
import { Profile } from '../../apis/routing-api/Profile';

export class RoutingComponent implements IControl {
    readonly api: RoutingApi;
    element: HTMLElement;
    map: Map;
    profiles: { id: string, description: string }[];
    markers: Marker[] = [];
    profile: string;

    constructor(api: RoutingApi) {
        this.api = api;
    }

    onAdd(map: mapboxgl.Map): HTMLElement {
        this.map = map;

        // create element.
        this.element = document.createElement("div");
        this.element.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

        // hook up events.
        var me = this;
        this.map.on("load", function (e) { me._mapLoad(e); });
        this.map.on("click", function (e) { me._mapClick(e); });

        return this.element;
    }

    onRemove(map: mapboxgl.Map) {
        throw new Error('Method not implemented.');
    }
    getDefaultPosition?: () => string;

    _calculateRoute() {
        if (this.markers.length < 2) return;
        if (!this.profile) return;

        var locations: { lng: number, lat: number }[] = [];
        for (var m in this.markers) {
            var marker = this.markers[m];
            locations.push(marker.getLngLat());
        }

        this.api.getRoute({
            locations: locations,
            profile: this.profile
        }, e => {
            this.map.getSource("route").setData(e);
        });
    }

    _mapLoad(e: any) {
        // trigger load profiles
        this.api.getProfiles(profiles => {
            this._createUI(profiles);
        });

        // add layers.
        this.map.addSource("route", {
            type: "geojson",
            data: {
                type: 'FeatureCollection',
                features: [
                ]
            }
        });
        this.map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#888',
                'line-width': 4
            }
        });
    }

    _mapClick(e: MapMouseEvent) {
        var me = this;

        if (this.markers.length < 2) {
            var marker = new Marker({
                draggable: true,
            }).setLngLat(e.lngLat)
                .addTo(this.map);
            marker.on("dragend", () => {
                me._calculateRoute();
            });
            this.markers.push(marker);
        }

        if (this.markers.length >= 2) {
            this._calculateRoute();
        }
    }

    _createUI(profiles: Profile[]) {
        var me = this;

        var componentHtml = ComponentHtml["index"];
        this.element.innerHTML = componentHtml;

        // add profiles as options.
        var select = document.getElementById("profiles");
        for (var p in profiles) {
            var profile = profiles[p];
            var option = document.createElement("option");
            option.value = profile.type + '.' + profile.name;
            option.innerHTML = profile.type + '.' + profile.name;
            select.appendChild(option);
        }

        // set the first profile as the default
        this.profile = profiles[0].type + '.' + profiles[0].name;

        // hook up the change event
        select.addEventListener("change", ()=> {
            select = document.getElementById("profiles");

            me.profile = select.value;
            me._calculateRoute();
        });
    }
}