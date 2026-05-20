export type DeltaDashExplanationSlide = {
  id: string;
  title: string;
  imageUrl: string;
};

export const deltaDashExplanationSlides: DeltaDashExplanationSlide[] = Array.from({ length: 5 }, (_, index) => {
  const slideNumber = index + 1;
  const padded = String(slideNumber).padStart(2, '0');

  return {
    id: `dd-4-explanation-${padded}`,
    title: `Explanation Slide ${padded}`,
    imageUrl: `/deltadash/explanation/4.0/slide-${padded}.png`,
  };
});
