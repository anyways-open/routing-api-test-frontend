import mapboxgl from 'mapbox-gl';
import { RoutingApi } from './apis/routing-api/RoutingApi';
import { RoutingOptionsComponent } from './components/routing-options/RoutingOptionsComponent';
import "./components/routing-options/RoutingOptionsComponent.css";

var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/basic/style.json?key=2Piy1GKXoXq0rHzzBVDA',
    center: [4.426690, 50.842000],
    zoom: 11.03,
    preserveDrawingBuffer: true,
    attributionControl: false,
});

var ra = new RoutingApi("https://staging.anyways.eu/routing-api/");
var o = new RoutingOptionsComponent(ra);

map.addControl(o);