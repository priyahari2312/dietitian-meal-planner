import { Link } from "@tanstack/react-router";

export default function Header() {
	return (
		<header className="border-b bg-background">
			<div className="mx-auto flex h-14 max-w-5xl items-center px-4">
				<Link to="/" className="text-lg font-semibold">
					My App
				</Link>

				<nav className="ml-8 flex gap-4">
					<Link
						to="/"
						className="text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground"
					>
						Home
					</Link>
					{/* Add your own routes here */}
				</nav>
			</div>
		</header>
	);
}
