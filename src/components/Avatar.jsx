export default function Avatar({ config, small = false }) {
  const style = {
    "--skin": config.skin,
    "--hair": config.hairColor,
    "--suit": config.outfit
  };

  return (
    <div className={`avatar ${small ? "small" : ""}`} style={style}>
      <div className={`hair ${config.hairStyle}`} />
      <div className="face">
        <div className="eyes"><span /><span /></div>
        <div className="mouth" />
      </div>
      {!small && (
        <>
          <div className="body"><span>V</span></div>
          <div className="arm left" />
          <div className="arm right" />
          <div className="leg left" />
          <div className="leg right" />
        </>
      )}
    </div>
  );
}
