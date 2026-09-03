function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src="/3dgifmaker01171.gif"
        alt="Refaat's Vision"
        style={{
          display: "block",
          width: "220px",
          height: "220px",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export default LoadingScreen;