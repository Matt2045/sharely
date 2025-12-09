import {type RouteConfig, route, layout} from "@react-router/dev/routes";

export default [
    layout("./routes/auth/auth-layout.tsx", [
        route("/", "./routes/root/sign-in.tsx"),
        route("sign-up", "./routes/root/sign-up.tsx"),
    ]),

    layout("./routes/public/public-layout.tsx", [
        route("feed", "./routes/public/feed.tsx"),
        route("share-pin", "./routes/public/share-pin.tsx"),
        route("user/:id", "./routes/public/user-profile.tsx"),
        route("pin/:id", "./routes/public/pin-detail.tsx"),
    ]),

    // API Routes (server-only)
    route("api/gemini", "./routes/api/api.gemini.ts"),



    // 404 Seite nicht gefunden
    route('*', "routes/root/notfoundpath.tsx")

] satisfies RouteConfig;