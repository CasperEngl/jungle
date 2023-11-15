import { ClassValue, VariantProps, tv } from "tailwind-variants";

export const container = tv({
  base: "relative inline-block max-w-full overflow-hidden",
});

export const shimmer = tv({
  base: "before:absolute before:inset-x-0 before:-top-1 before:bottom-0 before:-translate-x-full before:-skew-x-12 before:animate-[shimmer_2s_infinite] before:border-t before:bg-gradient-to-r before:from-transparent before:to-transparent",
  variants: {
    variant: {
      light: "before:border-white/5 before:via-white/5",
      dark: "before:border-black/5 before:via-black/5",
    },
  },
});

type NewLoadingShimmerProps = VariantProps<typeof shimmer> & {
  className: ClassValue;
};

export const LoadingShimmer: React.FC<NewLoadingShimmerProps> = ({
  variant,
  className,
}) => {
  return (
    <span
      className={container({
        className,
      })}
    >
      <div
        className={shimmer({
          variant: variant,
        })}
      ></div>
    </span>
  );
};
