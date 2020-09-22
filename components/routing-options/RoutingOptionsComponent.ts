import mapboxgl, { IControl, Map } from 'mapbox-gl';
import { RoutingApi } from '../../apis/routing-api/RoutingApi';
import ComponentHtml from '*.html';

export class RoutingOptionsComponent implements IControl {
    api: RoutingApi;
    element: HTMLElement;
    map: Map;
    profiles: {id: string, description: string}[];

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
        this.map.on("load",function(e) { me._mapLoad(e);});

        return this.element;
    }

    onRemove(map: mapboxgl.Map) {
        throw new Error('Method not implemented.');
    }
    getDefaultPosition?: () => string;

    _mapLoad(e: any) {
        // trigger load profiles
        this.api.getProfiles(profiles => {
            this._createUI(profiles);
        });
    }

    _createUI(profiles: string[]) {
        var componentHtml = ComponentHtml["index"];
        this.element.innerHTML = componentHtml;

        // add profiles as options.
        var select = document.getElementById("profiles");
        for (var p in profiles) {
            var profile = profiles[p];
            var option = document.createElement("option");
            option.value = profile;
            option.innerHTML = profile;
            select.appendChild(option);
        }
    }
}