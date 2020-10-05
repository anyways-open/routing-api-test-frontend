import mapboxgl, { IControl, Map, MapMouseEvent, Marker } from 'mapbox-gl';
import { RoutingApi } from '../../apis/routing-api/RoutingApi';
import ComponentHtml from '*.html';
import * as turf from '@turf/turf';
import { Profile } from '../../apis/routing-api/Profile';
import { EventsHub } from '../../libs/events/EventsHub';
import { RoutingComponentEvent } from './RoutingComponentEvent';

export class RoutingComponent implements IControl {
    readonly api: RoutingApi;
    element: HTMLElement;
    map: Map;
    profiles: { id: string, description: string }[];

    origin: Marker;
    destination: Marker;

    profile: string;

    events: EventsHub<RoutingComponentEvent> = new EventsHub();

    constructor(api: RoutingApi) {
        this.api = api;
    }

    on(name: string | string[], callback: (args: RoutingComponentEvent) => void) {
        this.events.on(name, callback);
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

    setProfile(profile: string) {
        this.profile = profile;

        var select = document.getElementById("profiles");
        if (select) {
            select.value = this.profile;
        }
    }

    setOrigin(l: mapboxgl.LngLatLike) {
        var me = this;

        if (this.origin) {
            this.origin.setLngLat(l);
        } else {

            var marker = new Marker({
                draggable: true,
            }).setLngLat(l)
                .addTo(this.map);

            this.events.trigger("origin", {
                component: this,
                marker: marker
            });

            marker.on("dragend", () => {
                this.events.trigger("origin", {
                    component: this,
                    marker: marker
                });

                me._calculateRoute();
            });

            this.origin = marker;
        }

        if (this.destination) {
            this._calculateRoute();
        }
    }

    setDestination(l: mapboxgl.LngLatLike) {
        var me = this;

        if (this.destination) {
            this.destination.setLngLat(l);
        } else {

            var marker = new Marker({
                draggable: true,
            }).setLngLat(l)
                .addTo(this.map);

            this.events.trigger("destination", {
                component: this,
                marker: marker
            });

            marker.on("dragend", () => {
                this.events.trigger("destination", {
                    component: this,
                    marker: marker
                });

                me._calculateRoute();
            });

            this.destination = marker;
        }

        this._calculateRoute();
    }

    onRemove(map: mapboxgl.Map) {
        throw new Error('Method not implemented.');
    }
    getDefaultPosition?: () => string;

    _calculateRoute() {
        if (this.origin && this.destination) { } else { return; }
        if (!this.profile) return;

        var locations: { lng: number, lat: number }[] = [];
        locations.push(this.origin.getLngLat());
        locations.push(this.destination.getLngLat());

        this.api.getRoute({
            locations: locations,
            profile: this.profile
        }, e => {
            this.map.getSource("route").setData(e);

            this.events.trigger("calculated", {
                component: this,
                route: e
            });
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

        if (this.origin) {
            this.setDestination(e.lngLat);

            this._calculateRoute();
        } else {
            this.setOrigin(e.lngLat);
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

        // set the first profile as the default or select the one that is there.
        if (this.profile) {
            select.value = this.profile;
        } else {
            this.profile = profiles[0].type + '.' + profiles[0].name;

            this.events.trigger("profile", {
                component: this,
                profile: this.profile
            });
        }

        // hook up the change event
        select.addEventListener("change", () => {
            select = document.getElementById("profiles");

            me.profile = select.value;

            this.events.trigger("profile", {
                component: me,
                profile: me.profile
            });

            me._calculateRoute();
        });
    }
}