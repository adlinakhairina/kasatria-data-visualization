
export function createDataCard(record) {
    // Create the main card container.
    const card = document.createElement('div');
    card.className = 'data-card';

    // Determine the card colour based on Net Worth.
    if (record.netWorth < 100000) {
        card.classList.add('net-worth-low');
    } else if (record.netWorth <= 200000) {
        card.classList.add('net-worth-medium');
    } else {
        card.classList.add('net-worth-high');
    }

    // Create the profile photo.
    const photo = document.createElement('img');
    photo.className = 'card-photo';
    photo.src = record.photo;
    photo.alt = `${record.name}'s photo`;

    photo.onerror = () => {
        photo.style.display = 'none';
    };

    // Create the person's name.
    const name = document.createElement('h3');
    name.className = 'card-name';
    name.textContent = record.name;

    // Create country and age information.
    const details = document.createElement('p');
    details.className = 'card-details';
    details.textContent = `${record.country} | Age ${record.age}`;

    // Create interest information.
    const interest = document.createElement('p');
    interest.className = 'card-interest';
    interest.textContent = record.interest;

    // Format Net Worth as currency.
    const netWorth = document.createElement('p');
    netWorth.className = 'card-net-worth';
    netWorth.textContent = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(record.netWorth);

    // Add all elements to the card.
    card.append(
        photo,
        name,
        details,
        interest,
        netWorth
    );

    return card;
}
