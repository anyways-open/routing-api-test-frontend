import { Map, LngLatLike } from 'mapbox-gl';
import { RoutingApi } from './apis/routing-api/RoutingApi';
import { RoutingComponent } from './components/routing-options/RoutingComponent';
import "./components/routing-options/RoutingComponent.css";
import { UrlHash } from './components/url-hash/UrlHash';

const urlState = UrlHash.read();

// parse the map state.
const mapState: {
    center: LngLatLike
    zoom: number
} = {
    center: [4.4019, 51.2260],
    zoom: 11.02
}
if (typeof urlState.map !== "undefined") {
    const parts = urlState.map.split("/");

    if (parts.length === 3) {
        mapState.center = [parseFloat(parts[1]), parseFloat(parts[2])];
        mapState.zoom = parseInt(parts[0], 10);
    }
}

const map = new Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic/style.json?key=2Piy1GKXoXq0rHzzBVDA',
    center: mapState.center,
    zoom: mapState.zoom,
    preserveDrawingBuffer: true,
    attributionControl: false,
});

const ra = new RoutingApi("https://routing.anyways.io/api/", "Vc32GLKD1wjxyiloWhlcFReFor7aAAOz");
const rc = new RoutingComponent(ra);

map.on("load", e => {
    if (typeof urlState.p !== "undefined") {
        rc.setProfile(urlState.p);
    }
    if (typeof urlState.o !== "undefined") {
        const parts = urlState.o.split(",");

        if (parts.length === 2) {
            rc.setOrigin([parseFloat(parts[0]), parseFloat(parts[1])]);
        }
    }
    if (typeof urlState.d !== "undefined") {
        const parts = urlState.d.split(",");

        if (parts.length === 2) {
            rc.setDestination([parseFloat(parts[0]), parseFloat(parts[1])]);
        }
    }

    function updateMapUrlState() {
        const center = map.getCenter();
        urlState.map = `${map.getZoom().toFixed(2)}/${center.lng.toFixed(5)}/${center.lat.toFixed(5)}`;

        UrlHash.write(urlState);
    }
    if (typeof urlState.map === "undefined") {
        updateMapUrlState();
    }

    map.on("moveend", e => {
        updateMapUrlState();
    });

    // get lowest label and road.
    var style = map.getStyle();
    var lowestRoad = undefined;
    var lowestLabel = undefined;
    var lowestSymbol = undefined;
    for (var l = 0; l < style.layers.length; l++) {
        var layer = style.layers[l];

        if (layer && layer["source-layer"] === "transportation") {
            if (!lowestRoad) {
                lowestRoad = layer.id;
            }
        }

        if (layer && layer["source-layer"] === "transportation_name") {
            if (!lowestLabel) {
                lowestLabel = layer.id;
            }
        }

        if (layer && layer.type == "symbol") {
            if (!lowestSymbol) {
                lowestSymbol = layer.id;
            }
        }
    }

    map.addSource('cyclenetworks-tiles', {
        type: 'vector',
        url: 'https://routing.anyways.eu/vector-tiles/cyclenetworks/mvt.json'
    });

    map.addLayer({
        "id": "cyclenetworks",
        "type": "line",
        "source": "cyclenetworks-tiles",
        "source-layer": "cyclenetwork",
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": "#ff0000",
            "line-width": [
                'interpolate', ['linear'], ['zoom'],
                10, 1,
                13, 2,
                16, 4
            ],
            "line-opacity": 1
        },
        "filter": [
            "all",
            [
                "==",
                "$type",
                "LineString"
            ]
        ]
    }, lowestLabel);
})

rc.on('origin', c => {
    urlState.o = `${c.marker.getLngLat().lng.toFixed(5)},${c.marker.getLngLat().lat.toFixed(5)}`;

    UrlHash.write(urlState);
});

rc.on('destination', c => {
    urlState.d = `${c.marker.getLngLat().lng.toFixed(5)},${c.marker.getLngLat().lat.toFixed(5)}`;

    UrlHash.write(urlState);
});

rc.on('profile', c => {
    urlState.p = c.profile;

    UrlHash.write(urlState);
});

map.addControl(rc);