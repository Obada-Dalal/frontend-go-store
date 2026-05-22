import "./styleWelcome.css";
export default function Welcome() {
  return (
    <div className="welcome">
      <div className="logo-welcome">
        <img src="Images/svgFooterLogo.svg" alt="Logo" />
      </div>
      <div className="text-welcome">
        <h1>مرحباً بكم في غو ستور</h1>
        <h2>نحن سعداء بزيارتكم لمتجرنا </h2>
      </div>
    </div>
  );
}
