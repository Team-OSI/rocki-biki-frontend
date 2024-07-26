export const videoContainerStyle = (isLocal, isOpponentUsingSkill, gameStatus) => ({
    transition: 'all 0.5s ease-in-out',
    position: 'absolute',
    width: isOpponentUsingSkill && !isLocal ? '45vw' : (['playing', 'finished', 'skillTime'].includes(gameStatus) ? '200px' : 'calc(40vw - 10px)'),
    height: isOpponentUsingSkill && !isLocal ? '33.75vw' : (['playing', 'finished', 'skillTime'].includes(gameStatus) ? '150px' : 'calc((40vw - 10px) * 3/4)'),
    zIndex: isOpponentUsingSkill && !isLocal ? 40 : 30,
    ...(['playing', 'finished', 'skillTime'].includes(gameStatus)
        ? isOpponentUsingSkill && !isLocal
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }
            : { top: '16px', [isLocal ? 'right' : 'left']: '10px' }
        : {
            top: '50%',
            left: isLocal ? 'calc(50% + 5px)' : 'calc(50% - 40vw - 5px)',
            transform: 'translate(0, -50%)'
        }),
});

export const videoStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '25px',
};

export const overlayStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.5,
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease-in-out',
};

export const nicknameStyle = {
    position: 'absolute',
    bottom: '-38px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '24px',
    color: 'white',
    backgroundColor: 'black',
    padding: '0px 40px',
    borderRadius: '20px / 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap'
};