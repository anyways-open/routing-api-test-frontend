import mapboxgl from 'mapbox-gl';
import { RoutingApi } from './apis/routing-api/RoutingApi';
import { RoutingComponent } from './components/routing-options/RoutingComponent';
import "./components/routing-options/RoutingComponent.css";

var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic/style.json?key=2Piy1GKXoXq0rHzzBVDA',
    center: [4.4019, 51.2260],
    zoom: 11.03,
    preserveDrawingBuffer: true,
    attributionControl: false,
});

var ra = new RoutingApi("https://routing.anyways.io/api/", "Vc32GLKD1wjxyiloWhlcFReFor7aAAOz");
var o = new RoutingComponent(ra);

map.addControl(o);