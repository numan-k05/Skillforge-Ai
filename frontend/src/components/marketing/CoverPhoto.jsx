export default function CoverPhoto({ kind }) {
  const skills = kind === "skills";
  return (
    <figure className={`cover-photo cover-photo--${kind}`}>
      <img
        src={`/images/${skills ? "skills-cover" : "careers-cover"}.png`}
        alt={skills ? "A sunlit workspace with a laptop and notebook for focused learning" : "Young professionals working together in a bright creative studio"}
        width="1536"
        height="1024"
        fetchPriority="high"
      />
      <figcaption><span className="cover-photo__dot" />{skills ? "A little learning. A new possibility." : "Find a direction that feels like you."}</figcaption>
    </figure>
  );
}
