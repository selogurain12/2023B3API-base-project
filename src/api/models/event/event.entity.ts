class Events {
    public id!: string; //au format uuidv4
    public date!: Date;
    public eventStatus?: 'Pending' | 'Accepted' | 'Declined' // valeur par défaut : 'Pending';
    public eventType!: 'RemoteWork' | 'PaidLeave';
    public eventDescription?: string;
    public userId!: string; //au format uuidv4
}