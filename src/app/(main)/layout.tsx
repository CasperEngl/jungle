import { UserAvatar } from "@/app/(main)/user-button";
import { currentUser, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { revalidateTag } from "next/cache";
import Link from "next/link";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  return (
    <>
      <header className="bg-slate-50 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-112 lg:items-start lg:overflow-y-auto xl:w-120">
        <div className="relative z-10 mx-auto px-4 pb-4 pt-10 sm:px-6 md:max-w-2xl md:px-4 lg:min-h-full lg:flex-auto lg:border-x lg:border-slate-200 lg:px-8 lg:py-12 xl:px-12">
          <div className="mt-10 text-center lg:mt-12 lg:text-left">
            <div className="relative">
              <SignedIn>
                {/* Mount the UserButton component */}
                <div className="grid place-items-center">
                  <UserAvatar />
                </div>

                <p className="pt-4 text-center text-xl font-bold text-slate-900">
                  <Link href="/">
                    {user?.firstName} {user?.lastName}
                  </Link>
                </p>
              </SignedIn>
              <SignedOut>
                {/* Signed out users get sign in button */}
                <SignInButton />
              </SignedOut>
            </div>

            {/* <p className="mt-3 text-lg font-medium leading-8 text-slate-700">
            Conversations with the most tragically misunderstood people of our
            time.
          </p> */}
          </div>
        </div>
      </header>

      <main className="border-t border-slate-200 lg:relative lg:mb-28 lg:ml-112 lg:border-t-0 xl:ml-120">
        <div className="relative">{children}</div>
      </main>
    </>
  );
}
