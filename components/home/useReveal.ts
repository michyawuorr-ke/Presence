import { useEffect } from "react";

export default function useReveal() {
	  useEffect(() => {
		      const els = document.querySelectorAll("[data-reveal]");

		          const io = new IntersectionObserver(
				        entries => {
						        entries.forEach(e => {
								          if (e.isIntersecting) {
										              const el = e.target as HTMLElement;
											                  const delay = el.dataset.delay || "0";
													              el.style.animationDelay = delay + "ms";
														                  el.classList.add("reveal");
																              io.unobserve(el);
																	                }
																			        });
																				      },
																				            { threshold: 0.15 }
																					        );

																						    els.forEach(el => io.observe(el));

																						        return () => io.disconnect();
																							  }, []);
}
