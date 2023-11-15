import { LoadingShimmer } from "@/app/loading-shimmer";
import { UserButton, currentUser } from "@clerk/nextjs";

export async function UserAvatar() {
  const user = await currentUser();

  return (
    <div className="h-20 w-20 max-w-full">
      {user?.hasImage ? (
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: "100%",
                height: "100%",
              },
            },
          }}
        />
      ) : (
        <LoadingShimmer
          variant="dark"
          className="h-full w-full rounded-full bg-black/5"
        />
      )}
    </div>
  );
}
