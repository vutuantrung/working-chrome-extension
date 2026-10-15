import "../../assets/css/components/Persona.css";

const StatusBadge = ({ status }: { status: string }) => {
    const active = status === "active";
    return (
        <span className={`persona-status-badge ${active ? "persona-status-badge--active" : "persona-status-badge--inactive"}`}>
            <span className="persona-status-badge__dot" />
            {status}
        </span>
    );
};

export default StatusBadge;
