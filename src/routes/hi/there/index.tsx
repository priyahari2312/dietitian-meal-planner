import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hi/there/")({
    component: HiTherePage,
});

function HiTherePage() {
    return (
        <div className="mx-auto max-w-2xl p-8">
            <h1 className="mb-2 text-3xl font-bold">Hi there!</h1>
            <p className="mb-6 text-muted-foreground">
                Hi There
            </p>
        </div>
    );
}