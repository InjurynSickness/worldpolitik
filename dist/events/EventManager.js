// /src/events/EventManager.ts
export class EventManager {
    showSimpleEventPopup(event, country, onComplete) {
        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventTitle');
        const description = document.getElementById('eventDescription');
        const choicesContainer = document.getElementById('eventChoices');
        title.textContent = event.title;
        description.textContent = event.description;
        choicesContainer.innerHTML = '';
        const currentPP = country.politicalPower ?? 0;
        for (const choice of event.choices) {
            const choiceButton = document.createElement('button');
            choiceButton.className = 'event-choice';
            const hasEnoughPP = choice.cost === 0 || (currentPP >= choice.cost);
            if (!hasEnoughPP)
                choiceButton.classList.add('insufficient-power');
            choiceButton.innerHTML = `
                <div>
                    ${choice.text}
                    ${choice.cost > 0 ? `<span class="event-choice-cost">${choice.cost} PP</span>` : ''}
                </div>
                <div class="event-choice-tooltip">${choice.effects}</div>
            `;
            choiceButton.addEventListener('click', () => {
                if (hasEnoughPP) {
                    choice.action();
                    modal.style.display = 'none';
                    onComplete();
                }
                else {
                    this.showNotification('Not enough Political Power!', 'error');
                }
            });
            choicesContainer.appendChild(choiceButton);
        }
        modal.style.display = 'block';
    }
    createTestEvent(country, showNotification) {
        return {
            title: 'Economic Opportunity',
            description: `A new technology breakthrough in ${country.name} could boost economic growth. How should the government respond?`,
            choices: [
                {
                    text: 'Invest heavily in research',
                    cost: 100,
                    effects: 'Increases economic growth by 2%, costs 100 PP',
                    action: () => {
                        country.economicGrowthRate = (country.economicGrowthRate ?? 0) + 2;
                        country.politicalPower = (country.politicalPower ?? 0) - 100;
                        showNotification('Investment successful! Economic growth increased', 'success');
                    }
                },
                {
                    text: 'Provide moderate support',
                    cost: 50,
                    effects: 'Increases economic growth by 1%, costs 50 PP',
                    action: () => {
                        country.economicGrowthRate = (country.economicGrowthRate ?? 0) + 1;
                        country.politicalPower = (country.politicalPower ?? 0) - 50;
                        showNotification('Moderate investment made', 'success');
                    }
                },
                {
                    text: 'Focus resources elsewhere',
                    cost: 0,
                    effects: 'No benefits, no costs',
                    action: () => {
                        showNotification('Opportunity ignored', 'info');
                    }
                }
            ]
        };
    }
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = '6px';
        notification.style.color = 'white';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10000';
        notification.style.backgroundColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}
//# sourceMappingURL=EventManager.js.map