export const getAvatarColor = (name: string) => {
    const colors = ['#D97757', '#417A55', '#C0392B', '#A0622A', '#8e44ad', '#2980b9', '#16a085', '#d35400', '#f39c12', '#2ecc71', '#34495e'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};
